const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const express = require("express");
const generateToken = require("../config/generateToken");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { sendEmail } = require("../config/sendEmail");
const router = express.Router();
require("dotenv").config();

// Google strategy for login
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ "google.accountId": profile.id });
        if (!user) {
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            google: { accountId: profile.id },
          });
          await user.save();
        }
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

// Facebook strategy for login
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_SECRET_KEY,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ "facebook.accountId": profile.id });
        if (!user) {
          user = new User({
            name: profile.displayName,
            facebook: { accountId: profile.id },
          });
          await user.save();
        }
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

router.post("/local/register", async (req, res) => {
  try {
    const { name, email, role, category, phone, password } = req.body;

    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      name,
      email,
      role,
      local: {
        password: hashedPassword,
      },
      category,
      phone,
    });

    // Save the new user to the database
    await newUser.save();

    if (role === "vendor") {
      const subject = "Vendor Registration Request";
      const message = `
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 16px;
              line-height: 1.6;
              color: #333;
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .container {
              margin: 20px auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              max-width: 600px;
            }
            h2 {
              color: #333;
              margin-top: 0;
            }
            p {
              margin: 10px 0;
              font-size: 16px;
            }
            a {
              color: #007bff;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Dear ${name},</h2>
            <p>Your vendor registration request has been received. Our team will review your request within 24 hours.</p>
            <p>Thank you for registering with us. You will receive an email notification once your account has been approved.</p>
            <p>In the meantime, feel free to explore our website to learn more about our products and services.</p>
            <p>You can visit our website at <a href="${process.env.CLIENT_URL}" target="_blank">${process.env.CLIENT_URL}</a>.</p>
            <p>If you have any questions or need further assistance, please don't hesitate to contact us.</p>
            <p>Best regards,</p>
            <p>The Team at Our Company</p>
          </div>
        </body>
      </html>
    `;

      await sendEmail(name, email, subject, message);
    }

    // Respond with success message
    res.status(201).json({
      message: "Registration successful",
      user: {
        ...newUser.toObject(),
        token: generateToken(newUser._id),
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        // Find user by email
        const user = await User.findOne({ email });

        // Check if user exists
        if (!user) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        // Check if user role is vendor and vendor access is approved
        if (user.role === 'vendor' && !user.vendorAccess) {
          return done(null, false, { message: 'Vendor access is not approved yet.' });
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.local.password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        // If everything is correct, return the user
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

const successRedirect = (req, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.redirect("/auth/login/error");
  }
};

router.post("/local/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      const userWithoutPassword = { ...user.toObject() };
      delete userWithoutPassword.local;
      res.json({
        message: "User logged in successfully.",
        user: {
          ...userWithoutPassword,
          token: generateToken(user._id),
        },
      });
    });
  })(req, res, next);
});

router.get("/local/error", (req, res) => res.send("Error logging in.."));

// Google login routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: process.env.CLIENT_URL, // Redirect to success page
    failureRedirect: "/auth/google/error",
  })
);

router.get("/google/error", (req, res) =>
  res.send("Error logging in via Google..")
);

// Facebook login routes
router.get("/facebook", passport.authenticate("facebook", { scope: "email" }));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/auth/facebook/error",
  }),
  (req, res) => {
    // Redirect to success page
    res.redirect("/auth/login/success");
  }
);

router.get("/facebook/error", (req, res) =>
  res.send("Error logging in via Facebook..")
);

router.get("/login/success", successRedirect);

router.get("/google/success", successRedirect);

router.get("/facebook/success", successRedirect);

// Logout route
router.get("/logout", (req, res) => {
  req.logout(); // Passport method to clear login session
  res.redirect("/"); // Redirect to home page or login page
});

//forgot-password

// Generate a 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAILUSER,
        pass: process.env.EMAILPASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAILUSER,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 20px auto;
                padding: 20px;
                background-color: #fff;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              h1 {
                color: #333;
              }
              p {
                color: #555;
                font-size: 16px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Password Reset OTP</h1>
              <p>Your OTP for password reset is: <strong>${otp}</strong></p>
              <p>Please use this OTP to reset your password.</p>
            </div>
          </body>
        </html>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("OTP email sent");
  } catch (error) {
    console.error("Error sending OTP email:", error);
  }
};

// Request OTP for password reset
router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send("User not found. Please register first.");
    }

    const otp = generateOTP();
    user.resetOTP = otp;
    user.resetOTPExpires = Date.now() + 600000;

    await user.save();
    await sendOTPEmail(email, otp);
    res.send("OTP sent to your email");
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({
      email,
      resetOTP: otp,
      resetOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send("Invalid or expired OTP");
    }

    res.send("OTP verified successfully");
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Reset password
router.post("/reset", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password
    user.local.password = hashedPassword;
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;

    await user.save();
    res.send("Password reset successful");
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to get all users
router.get("/getUsers", async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find({}, "-local.password");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
