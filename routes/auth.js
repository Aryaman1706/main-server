const express = require('express')
const router = express.Router()
const passport = require('passport')
const jwt = require('jsonwebtoken')
const querystring = require('querystring');
const {User} = require('../models/User')
const Room = require('../models/Room')

router.get('/', async (req, res) => {
    try {
        const requestURI = req.headers['x-forwarded-uri']
        const roomId = req.headers['x-forwarded-prefix'].split('/')[1]
        const token = querystring.parse(requestURI.split('?')[1]).token
        const email = jwt.verify(token, process.env.JWT_SECRET).data.email

        const user = await User.findOne({email:email})
        const room = await Room.findOne({_id:roomId})
        const userId = user._id

        //check id user is host
        if (room.host.toString() == userId.toString()) {
            return res.status(200).send('go ahead comrade')
        }

        //check if user is participant
        if (room.participants.indexOf(userId) > -1) {
            return res.status(200).send({ status: 'go ahead comrade' })
        }
        console.log(user,room)
        



        return res.status(200)
    }

    catch (e) {
        return res.status(401).send('Unauthorised')
    }

})

// @desc    Auth with Google
// @route   GET /auth/google
router.get('/google', passport.authenticate(
    'google', {
    session: false,
    scope: ["profile", "email"],
    accessType: "offline",
    approvalPrompt: "force"
}))


// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get(
    '/google/callback',
    passport.authenticate(
        'google',
        {
            failureRedirect: '/',
            session: false
        }),
    (req, res) => {
        let user = {
            displayName: req.user.displayName,
            name: req.user.firstName,
            email: req.user.email,
        }

        let token = jwt.sign({
            data: user
        }, process.env.JWT_SECRET, { expiresIn: '1h' })
        res.cookie('jwt', token)
        res.redirect('/profile')
    }
)

// @desc    logout user
// @route   /auth/logout
router.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})
module.exports = router
