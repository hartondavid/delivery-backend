import { Router } from "express";
import db from "../utils/database.mjs";
import bcrypt from "bcrypt";
import { getAuthToken, md5Hash, sendJsonResponse } from "../utils/utilFunctions.mjs";
import { userAuthMiddleware } from "../utils/middlewares/userAuthMiddleware.mjs";
import jwt from "jsonwebtoken";


const router = Router();

// Test endpoint to check database and list users (not protected)
router.get('/test-db', async (req, res) => {
    try {
        console.log('🔍 Testing database connection...');

        // Test database connection
        const knex = await db();
        await knex.raw('SELECT 1');
        console.log('✅ Database connection successful');

        // Get all users
        const users = await knex('users').select('id', 'name', 'email', 'phone');
        console.log('📋 Found users:', users.length);

        return sendJsonResponse(res, true, 200, "Database test successful", {
            connection: 'successful',
            usersCount: users.length,
            users: users
        });
    } catch (error) {
        console.error("Database test error:", error);
        return sendJsonResponse(res, false, 500, "Database test failed", {
            error: error.message,
            stack: error.stack
        });
    }
});

// Test token endpoint (not protected)
router.post('/test-token', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return sendJsonResponse(res, false, 400, "Token is required", []);
        }

        console.log('🔍 Testing token:', token.substring(0, 20) + '...');

        // Verify token
        const JWT_SECRET = process.env.JWT_SECRET;

        if (!JWT_SECRET || JWT_SECRET === 'your_jwt_secret') {
            console.error('❌ JWT_SECRET not properly configured! Please set JWT_SECRET environment variable.');
            return sendJsonResponse(res, false, 500, "Server configuration error - JWT_SECRET not set", []);
        }

        const decodedToken = jwt.verify(token, JWT_SECRET);

        console.log('✅ Token verified:', decodedToken);

        // Get user from database
        const user = await (await db())('users').where({ id: decodedToken.id }).first();

        if (!user) {
            return sendJsonResponse(res, false, 404, "User not found", []);
        }

        return sendJsonResponse(res, true, 200, "Token is valid", {
            token: decodedToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error("Token test error:", error);
        return sendJsonResponse(res, false, 400, "Invalid token", {
            error: error.message
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validate request
        if (!email || !password) {
            return sendJsonResponse(res, false, 400, "Email and password are required", []);
        }
        // Fetch user from database
        const user = await (await db())('users').where({ email }).first();

        if (!user) {
            return sendJsonResponse(res, false, 401, "Invalid credentials", []);
        }

        // Compare passwords (hashed with MD5)
        const hashedPassword = md5Hash(password);

        if (hashedPassword !== user.password) {
            return sendJsonResponse(res, false, 401, "Invalid credentials", []);
        }

        // Generate JWT token
        const token = getAuthToken(user.id, user.phone, false, '1d', true)

        await (await db())('users')
            .where({ id: user.id })
            .update({ last_login: parseInt(Date.now() / 1000) });

        // Set custom header
        res.set('X-Auth-Token', token);

        return sendJsonResponse(res, true, 200, "Successfully logged in!", {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone
            },
            token: token
        });
    } catch (error) {
        console.error("Login error:", error);
        return sendJsonResponse(res, false, 500, "Internal server error", []);
    }
});


router.get('/checkLogin', userAuthMiddleware, async (req, res) => {
    return sendJsonResponse(res, true, 200, "User is logged in", req.user);
})

// Get customer profile
router.get('/profile/:userId', async (req, res) => {
    try {
        const user = await (await db())('users').where({ id: req.params.userId }).first();
        if (!user) return sendJsonResponse(res, false, 404, "User not found", []);

        return sendJsonResponse(res, true, 200, "User fetched successfully", { id: user.id, name: user.name, email: user.email, created_at: user.created_at });
    } catch (err) {
        return sendJsonResponse(res, false, 500, "Failed to get user", { details: err.message });
    }
});

// Update password
router.put('updatePassword/:userId', async (req, res) => {
    const { password } = req.body;
    if (!password) return sendJsonResponse(res, false, 400, "Missing password", []);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await (await db())('users').where({ id: req.params.userId }).update({ password: hashedPassword });
        return sendJsonResponse(res, true, 200, "Password updated", []);
    } catch (err) {
        return sendJsonResponse(res, false, 500, "Failed to update password", { details: err.message });
    }
});

router.get('/getCouriers', userAuthMiddleware, async (req, res) => {
    try {
        const users = await (await db())('users')
            .join('user_rights', 'users.id', 'user_rights.user_id')
            .where('user_rights.right_id', 2)
            .select('users.*');

        if (!users) return sendJsonResponse(res, false, 404, "Nu există curieri!", []);
        return sendJsonResponse(res, true, 200, `Lista curierilor:`, users);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la preluarea curierilor!", { details: error.message });
    }
});

router.get('/getAllCouriersByAdminId', userAuthMiddleware, async (req, res) => {
    try {

        const userRights = await (await db())('user_rights').where({ user_id: req.user.id })
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 1)
            .first();


        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat sa accesati aceasta pagina!", []);
        }

        const users = await (await db())('users')
            .join('user_rights', 'users.id', 'user_rights.user_id')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 2)
            .select('users.*');



        if (!users) return sendJsonResponse(res, false, 404, "Nu există curieri!", []);
        return sendJsonResponse(res, true, 200, `Lista curierilor:`, users);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la preluarea curierilor!", { details: error.message });
    }
});

router.get('/searchCourier', userAuthMiddleware, async (req, res) => {
    const { searchField } = req.query;

    if (!searchField) {
        return sendJsonResponse(res, false, 400, 'Search field is required', null);
    }

    try {
        // Query the database to search for employees where name contains the searchField
        const couriers = await (await db())('users')
            .join('user_rights', 'users.id', 'user_rights.user_id')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 2)
            .where(function () {
                this.where('users.name', 'like', `%${searchField}%`)
                    .orWhere('users.email', 'like', `%${searchField}%`)
            })
            .whereNotIn('users.id', (await db())('user_routes').select('courier_id'))
            .select('users.*');


        if (couriers.length === 0) {
            return sendJsonResponse(res, false, 404, 'Nu există curieri!', []);
        }

        // Attach the employees to the request object for the next middleware or route handler
        return sendJsonResponse(res, true, 200, 'Curierii au fost găsiți!', couriers);
    } catch (err) {
        console.error(err);
        return sendJsonResponse(res, false, 500, 'An error occurred while retrieving employeesr', null);
    }
})

router.post('/addCourierToRoute/:routeId', userAuthMiddleware, async (req, res) => {
    const { courier_id } = req.body;
    const userId = req.user?.id;
    const routeId = req.params.routeId;

    const userRights = await (await db())('user_rights')
        .join('rights', 'user_rights.right_id', 'rights.id')
        .where({ 'user_rights.user_id': userId, 'rights.right_code': 2 })
        .first();

    try {
        if (userRights) {
            return sendJsonResponse(res, false, 403, "Doar administratorii pot adăuga curieri!", []);
        }
        await (await db())('user_routes').insert({ courier_id: courier_id, route_id: routeId });
        const courier = await (await db())('users').where({ id: courier_id }).first();
        return sendJsonResponse(res, true, 200, "Curierul a fost adăugat la ruta!", { courier });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la asocierea comenzilor la livrare!", { details: error.message });
    }
});


router.post('/addCourier', userAuthMiddleware, async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phone,
            confirm_password
        } = req.body;

        if (password.length < 6) {
            return sendJsonResponse(res, false, 400, "Parola trebuie sa aiba minim 6 caractere", null);
        }

        // Fields that are allowed to be added for a new user
        const validFields = [
            'name', 'email', 'password', 'phone', 'confirm_password'
        ];

        // Build the new user data from the request, only including valid fields
        const userData = {};
        for (const key in req.body) {
            if (validFields.includes(key)) {
                userData[key] = key === "password" ? md5Hash(req.body[key]) : userData[key] = key === "confirm_password" ? md5Hash(req.body[key]) : req.body[key];
            }
        }


        // Ensure required fields are present
        if (!userData.name || !userData.email || !userData.password || !userData.phone || !userData.confirm_password) {
            return sendJsonResponse(res, false, 400, "Missing required fields", null);
        }
        if (userData.password !== userData.confirm_password) {
            return sendJsonResponse(res, false, 400, "Parolele nu coincid!", []);
        }

        const phoneRegex = /^07[0-9]{8}$/;
        if (!phoneRegex.test(userData.phone)) {
            return sendJsonResponse(res, false, 400, "Numărul de telefon trebuie să înceapă cu 07 și să aibă 10 cifre.", null);
        }


        if (userData.name.length < 3) {
            return sendJsonResponse(res, false, 400, "Numele trebuie sa aiba minim 3 caractere", null);
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(userData.email)) {
            return sendJsonResponse(res, false, 400, "Emailul nu este valid", null);
        }

        const phoneExists = await (await db())('users').where('phone', userData.phone).first();
        if (phoneExists) {
            return sendJsonResponse(res, false, 400, "Numărul de telefon este deja înregistrat", null);
        }



        let newUserId;
        // let rightCode;
        const userEmail = await (await db())('users').where('email', email).first();
        if (!userEmail) {
            // Insert the new user into the database
            const userIdResult = await (await db())('users')
                .insert(userData)
                .returning('id');
            const userId = Array.isArray(userIdResult) ? userIdResult[0] : userIdResult;
            // Extract the actual ID value from the object
            newUserId = typeof userId === 'object' && userId.id ? userId.id : userId;

            const rightCode = await (await db())('rights').where('right_code', 2).first();

            await (await db())('user_rights').insert({
                user_id: newUserId,
                right_id: rightCode.id
            });

            sendJsonResponse(res, true, 201, "Curierul a fost creat cu succes", { id: newUserId });
        } else {
            sendJsonResponse(res, false, 400, "Curierul exista deja", null);
        }


    } catch (error) {
        console.error("Error creating user:", error);
        sendJsonResponse(res, false, 500, "Internal server error", null);
    }
});

router.delete('/deleteCourier/:courierId', userAuthMiddleware, async (req, res) => {
    try {

        const { courierId } = req.params;

        console.log('courierId', courierId);

        const loggedUserId = req.user.id;

        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 1)
            .where('user_rights.user_id', loggedUserId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const user = await (await db())('users').where({ id: courierId }).first();
        if (!user) return sendJsonResponse(res, false, 404, "Curierul nu există!", []);

        console.log('user', user);

        await (await db())('users').where({ id: courierId }).del();
        return sendJsonResponse(res, true, 200, "Curierul a fost șters cu succes!", []);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la ștergerea ingredientului!", { details: error.message });
    }
});
export default router;