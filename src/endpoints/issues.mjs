import { Router } from "express";
import db from "../utils/database.mjs";
import { sendJsonResponse } from "../utils/utilFunctions.mjs";
import { userAuthMiddleware } from "../utils/middlewares/userAuthMiddleware.mjs";

const router = Router();

// Adaugă o problemă nouă
router.post('/addIssue/:deliveryId', userAuthMiddleware, async (req, res) => {

    try {
        const { description } = req.body;
        const { deliveryId } = req.params;

        const userId = req.user.id;

        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 2 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const idResult = await (await db())('issues').insert({ description, delivery_id: deliveryId });
        const id = Array.isArray(idResult) ? idResult[0] : idResult;

        return sendJsonResponse(res, true, 201, "Problema a fost adăugată cu succes!", { id });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la adăugarea problemei!", { details: error.message });
    }
});

// Actualizează o problemă
router.put('/updateIssue/:issueId', userAuthMiddleware, async (req, res) => {

    try {

        const { issueId } = req.params;
        const { description, delivery_id } = req.body;

        const userId = req.user.id;

        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 2 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const issue = await (await db())('issues').where({ id: issueId }).first();
        if (!issue) return sendJsonResponse(res, false, 404, "Problema nu există!", []);
        await (await db())('issues').where({ id: issueId }).update({
            description: description || issue.description,
            delivery_id: delivery_id || issue.delivery_id
        });
        const updated = await (await db())('issues').where({ id: issueId }).first();
        return sendJsonResponse(res, true, 200, "Problema a fost actualizată cu succes!", { issue: updated });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la actualizarea problemei!", { details: error.message });
    }
});

// Șterge o problemă
router.delete('/deleteIssue/:issueId', userAuthMiddleware, async (req, res) => {

    try {
        const { issueId } = req.params;

        const userId = req.user.id;

        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 2 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }


        const issue = await (await db())('issues').where({ id: issueId }).first();
        if (!issue) return sendJsonResponse(res, false, 404, "Problema nu există!", []);
        await (await db())('issues').where({ id: issueId }).del();
        return sendJsonResponse(res, true, 200, "Problema a fost ștearsă cu succes!", []);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la ștergerea problemei!", { details: error.message });
    }
});

// Listare probleme
router.get('/getIssuesByAdminId', userAuthMiddleware, async (req, res) => {
    try {

        const userId = req.user.id;

        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 1 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const issues = await (await db())('issues')
            .join('delivery', 'issues.delivery_id', 'delivery.id')
            .join('users', 'delivery.courier_id', 'users.id')
            .select('issues.*', 'delivery.id as delivery_id', 'users.name as courier_name');
        return sendJsonResponse(res, true, 200, "Problemele au fost preluate cu succes!", issues);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la listarea problemelor!", { details: error.message });
    }
});
router.get('/getIssue/:issueId', userAuthMiddleware, async (req, res) => {

    try {

        const { issueId } = req.params;


        const userId = req.user.id;

        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 2 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }


        const issue = await (await db())('issues')
            .where({ id: issueId })
            .select(
                'issues.id',
                'issues.description',
                'issues.delivery_id',
                'issues.created_at',
            )
            .first();

        if (!issue) {
            return sendJsonResponse(res, false, 404, 'Problema nu există!', []);
        }
        return sendJsonResponse(res, true, 200, 'Problema a fost găsită!', issue);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea problemei!', { details: error.message });
    }
});

router.get('/getIssuesByCourierId', userAuthMiddleware, async (req, res) => {
    try {

        const userId = req.user.id;

        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 2 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const issues = await (await db())('issues')
            .join('delivery', 'issues.delivery_id', 'delivery.id')
            .join('users', 'delivery.courier_id', 'users.id')
            .where({ 'delivery.courier_id': userId })
            .select('issues.*', 'delivery.id as delivery_id', 'users.name as courier_name');

        return sendJsonResponse(res, true, 200, "Problemele au fost preluate cu succes!", issues);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la listarea problemelor!", { details: error.message });
    }
});

export default router; 