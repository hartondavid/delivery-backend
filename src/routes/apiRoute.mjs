import { Router } from "express";
import users from '../endpoints/users.mjs'
import orders from '../endpoints/orders.mjs'
import delivery from '../endpoints/delivery.mjs'
import issues from '../endpoints/issues.mjs'
import routes from '../endpoints/routes.mjs'
import rights from '../endpoints/rights.mjs'
const router = Router();

router.use('/users/', users)
router.use('/orders/', orders)
router.use('/delivery/', delivery)
router.use('/issues/', issues)
router.use('/routes/', routes)
router.use('/rights/', rights)


export default router;