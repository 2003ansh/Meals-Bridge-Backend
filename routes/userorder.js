const express = require('express')
const router = express.Router();
const { body, validationResult } = require('express-validator');
const UserOrder = require('../models/Order');
const Profile = require('../models/Profile');
var fetchuser = require('../middleware/fetchuser');
const { v4: uuidv4 } = require('uuid');
//Route 1: fetch  UserOrder by giving oid using: get "http://localhost:3000/api/order/singleOrder/:id". login required
router.get('/singleOrder/:id', async (req, res) => {
    try {
        
        const userorder = await UserOrder.find({ oid: req.params.id });
        if (!userorder) {
            return res.status(404).send("Not Found");
        }
        res.json(userorder);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

//Route 2: fetch  UserOrder of a particular user by giving uid  using: get "http://localhost:3000/api/order/allOrder/:id". login required
router.get('/allOrder/:id', async (req, res) => {
    try {
        const userorder = await UserOrder.find({ uid: req.params.id });
        if (!userorder) {
            return res.status(404).send("Not Found");
        }
        res.json(userorder);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

//Route 3: fetch all  order from order collection and status using: get "http://localhost:3000/api/order/Orderloc". login required
// send location and oid and uid
router.get('/Orderloc/:id', async (req, res) => {
    try {
        const id = req.params.id; // Get the ID from the request parameters
        const userorder = await UserOrder.find({ status: false, Assignuid: { $in: [id] } })
                                        .sort({ createdAt: -1 })
                                        .limit(10)
                                        .exec();
        
        if (userorder.length === 0) {
            return res.json(userorder);
        }
        
        res.json(userorder);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})


//Route 4: updated status of order using: put "http://localhost:3000/api/order/updateOrder/:id". login required

router.put('/updateOrder/:id',[
    body('reciveruid', 'Enter a valid reciveruid').isLength({ min: 1 }),
], async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userorder = await UserOrder.findOne({ oid: req.params.id });
        if (!userorder) {
            return res.status(404).send("Not Found");
        }
        if (userorder.status) {
            return res.status(400).send("Reciever already assigned to this order.");
        }
        userorder.status = true;
        userorder.reciveruid = req.body.reciveruid;
        const savedUserOrder = await userorder.save();
        res.json(savedUserOrder);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})





//Route 5: Add a new UserOrder using: POST "http://localhost:3000/api/order/addUserOrder". login required

router.post('/addUserOrder',[
    body('uid', 'Enter a valid id').isLength({ min: 1 }),
    body('image', 'Enter a valid image').isArray({ min: 1 }),
    body('foodname', 'Enter a valid foodname').isArray({ min: 1 }),
    body('quantity', 'Enter a valid quantity').isArray({ min: 1 }),
    body('location', 'Enter a valid location').isLength({ min: 1 }),
    body('Assignuid', 'Enter a valid receiver uid').isArray({ min: 1 }),
] ,async (req, res) => {
    try {
        // check if the user already exists
        const existingUser = await Profile.findOne({ uid: req.body.uid });
        console.log(req.body.uid)
        if (!existingUser) {
            return res.status(400).json({ error: "Sorry, a user with this id does not exist" });
        }
        
        const { uid, image, foodname, quantity, location, status, Assignuid } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Calculate total quantity
        // Assuming quantity is an array of strings representing numbers
const total = quantity.reduce((acc, curr) => acc + parseFloat(curr), 0);

        const shortUuid = `GN${uuidv4()}`;
        const oid = shortUuid.substr(0, 6);
        const userorder = new UserOrder({ uid, oid, image, foodname, quantity, location, status, Assignuid, total });
        const savedUserOrder = await userorder.save();
        res.json(savedUserOrder);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
})

//Route 6: fetch all  order from order collection of a specific ngo using: get "http://localhost:3000/api/order/archieve". login required
// send location and oid and uid
router.get('/archieve/:id', async (req, res) => {
    try {
        const id = req.params.id; // Get the ID from the request parameters
        const userorder = await UserOrder.find({ status: true, reciveruid: id })
                                        .sort({ createdAt: -1 })
                                        .limit(10)
                                        .exec();
        
        if (userorder.length === 0) {
            return res.json(userorder);
        }
        
        res.json(userorder);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

//Route 7: updated isCompleted of order using: put "http://localhost:3000/api/order/isCompleted/:id". login required

router.put('/isCompleted/:id', async (req, res) => {
    try {

        

        const userorder = await UserOrder.findOne({ oid: req.params.id });
        if (!userorder) {
            return res.status(404).send("Not Found");
        }
        if (userorder.isCompleted) {
            return res.status(400).send("Order already completed.");
        }
        userorder.isCompleted = true;
        const savedUserOrder = await userorder.save();
        res.json(savedUserOrder);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

module.exports = router;