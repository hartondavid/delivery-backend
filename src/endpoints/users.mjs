import { Router } from "express";
import db from "../utils/database.mjs";
import bcrypt from "bcrypt";
import { getAuthToken, md5Hash, sendJsonResponse } from "../utils/utilFunctions.mjs";
import { userAuthMiddleware } from "../utils/middlewares/userAuthMiddleware.mjs";


const router = Router();

// // Register
// router.post('/register', async (req, res) => {
//     const { name, email, password } = req.body;
//     if (!name || !email || !password) return sendJsonResponse(res, false, 400, "Missing fields", []);

//     try {
//         const existing = await db('users').where({ email }).first();
//         if (existing) return sendJsonResponse(res, false, 409, "Email already registered", []);

//         const hashedPassword = await bcrypt.hash(password, 10);
//         const [id] = await db('users').insert({ name, email, password: hashedPassword });
//         return sendJsonResponse(res, true, 201, "User registered successfully", { id, name, email });
//     } catch (err) {
//         return sendJsonResponse(res, false, 500, "Registration failed", { details: err.message });
//     }
// });

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validate request
        if (!email || !password) {
            return sendJsonResponse(res, false, 400, "Email and password are required", []);
        }
        // Fetch user from database
        const user = await db('users').where({ email }).first();

        if (!user) {
            return sendJsonResponse(res, false, 401, "Invalid credentials", []);
        }

        // Compare passwords (hashed with MD5)
        const hashedPassword = md5Hash(password);

        if (hashedPassword !== user.password) {
            return sendJsonResponse(res, false, 401, "Invalid credentials", []);
        }

        // Generate JWT token
        const token = getAuthToken(user.id, user.email, false, '1d', true)

        await db('users')
            .where({ id: user.id })
            .update({ last_login: parseInt(Date.now() / 1000) });

        // Set custom header
        res.set('X-Auth-Token', token);

        return sendJsonResponse(res, true, 200, "Successfully logged in!", { user });
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
        const user = await db('users').where({ id: req.params.userId }).first();
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
        await db('users').where({ id: req.params.userId }).update({ password: hashedPassword });
        return sendJsonResponse(res, true, 200, "Password updated", []);
    } catch (err) {
        return sendJsonResponse(res, false, 500, "Failed to update password", { details: err.message });
    }
});

router.get('/getCouriers', userAuthMiddleware, async (req, res) => {
    try {
        const users = await db('users')
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

        const userRights = await db('user_rights').where({ user_id: req.user.id })
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 1)
            .first();


        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat sa accesati aceasta pagina!", []);
        }

        const users = await db('routes')
            .join('user_routes', 'routes.id', 'user_routes.route_id')
            .join('users', 'user_routes.courier_id', 'users.id')
            .where('routes.admin_id', req.user.id)
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
        const couriers = await db('users')
            .join('user_rights', 'users.id', 'user_rights.user_id')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 2)
            .where(function () {
                this.where('users.name', 'like', `%${searchField}%`)
                    .orWhere('users.email', 'like', `%${searchField}%`)
            })
            .whereNotIn('users.id', db('user_routes').select('courier_id'))
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

router.delete('/deleteCourier/:courierId', userAuthMiddleware, async (req, res) => {
    const { courierId } = req.params;
    try {
        const courier = await db('users').where({ id: courierId }).first();
        if (!courier) return sendJsonResponse(res, false, 404, "Curierul nu există!", []);
        await db('user_routes').where({ courier_id: courierId }).del();
        return sendJsonResponse(res, true, 200, "Curierul a fost șters cu succes!", []);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la ștergerea curierului!", { details: error.message });
    }
});

router.post('/addCourierToRoute/:routeId', userAuthMiddleware, async (req, res) => {
    const { courier_id } = req.body;
    const userId = req.user?.id;
    const routeId = req.params.routeId;

    const userRights = await db('user_rights')
        .join('rights', 'user_rights.right_id', 'rights.id')
        .where({ 'user_rights.user_id': userId, 'rights.right_code': 2 })
        .first();

    try {
        if (userRights) {
            return sendJsonResponse(res, false, 403, "Doar administratorii pot adăuga curieri!", []);
        }
        await db('user_routes').insert({ courier_id: courier_id, route_id: routeId });
        const courier = await db('users').where({ id: courier_id }).first();
        return sendJsonResponse(res, true, 200, "Curierul a fost adăugat la ruta!", { courier });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la asocierea comenzilor la livrare!", { details: error.message });
    }
});

export default router;