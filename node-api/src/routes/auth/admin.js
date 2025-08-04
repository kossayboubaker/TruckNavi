import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import randomToken from "random-token";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import { adminModel } from "../../schemas/admin.schema.js";
import { passwordResetModel } from "../../schemas/passwordResets.schema.js";
import multer from 'multer';
import path from 'path';
import fs from "fs";

dotenv.config();
const router = express.Router();

// ✅ Transporteur Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: "ipact2021@gmail.com",
    pass: "xvrlclpmqdqdjnwg",
  }
});

// ✅ Google Strategy
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "/admin/auth/google/callback",
//       scope: ["profile", "email"],
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         let admin = await adminModel.findOne({ email: profile.emails[0].value });
//         if (admin) return done(null, admin);

//         const newAdmin = new adminModel({
//           company_name: profile.displayName,
//           email: profile.emails[0].value,
//           password: await bcrypt.hash(randomToken(20), 10),
//           role: "admin_client",
//           num: "",
//           country: "",
//           code_tva: "",
//           isActive: false,
//         });

//         await newAdmin.save();
//         return done(null, newAdmin);
//       } catch (error) {
//         return done(error, null);
//       }
//     }
//   )
// );

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await adminModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
// Middleware pour vérifier l'authentification
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);

    req.user = user; // Assurez-vous que user contient bien userId
    next();
  });}
  
// Configuration du dossier upload
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Config multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.put("/update-profile", authenticateToken, upload.single("image"), async (req, res) => {
  console.log("Fichier reçu :", req.file);
  const allowedFields = ["company_name", "email", "role", "num", "country", "code_tva"];
  const updates = {};

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (req.file) {
    updates.image = req.file.filename;
  }

  try {
    const adminId = req.user.userId;
    const admin = await adminModel.findByIdAndUpdate(adminId, updates, { new: true });

    if (!admin) {
      return res.status(404).json({ message: "Admin non trouvé" });
    }

    res.json({
      message: "Profil mis à jour avec succès",
      admin: {
        _id: admin._id,
        name: admin.name,
        image: admin.image,
        email: admin.email,
        role: admin.role,
        // ajoutez d'autres champs si besoin
      },
    });
  } catch (error) {
    console.error("Erreur :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const adminId = req.user.userId;

    const admin = await adminModel.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: "Admin non trouvé" });
    }

    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      company_name: admin.company_name,
      num: admin.num,
      country: admin.country,
      code_tva: admin.code_tva,
      image: admin.image,
      // Ajoutez d'autres champs si vous en avez dans le modèle
    });
  } catch (error) {
    console.error("Erreur :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

  
  
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const admin = await adminModel.findById(req.user.userId).select(
      "company_name email role num country code_tva image"
    );

    if (!admin) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: admin._id,
      attributes: {
        company_name: admin.company_name,
        email: admin.email,
        role: admin.role,
        num: admin.num,
        country: admin.country,
        code_tva: admin.code_tva,
        image: admin.image, // Ajout ici
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/admins", async (req, res) => {
  try {
    const admins = await adminModel.find({});
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération" });
  }
});
// Modifier statut actif/inactif
router.put("/admins/:id/toggle", async (req, res) => {
  try {
    const updated = await adminModel.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la mise à jour du statut." });
  }
});

// Supprimer un admin
router.delete("/admins/:id", async (req, res) => {
  try {
    await adminModel.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
});


// ✅ Routes Google Auth
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_ACC_ACTIVATE, { expiresIn: "1h" });
    const redirectUrl = `${process.env.ADMIN_URL}/auth/google/callback?token=${token}`;
    res.redirect(redirectUrl);
  }
);


// 🚀 Route d'inscription d'un admin
router.post("/admin/register", async (req, res) => {
  try {
    const { company_name, email, password, role, num, country, code_tva, image } = req.body;

    let existingAdmin = await adminModel.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    const validRoles = ["super_admin", "admin_flotte", "admin_client", "admin_support"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Le rôle '${role}' n'est pas valide.` });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new adminModel({
      company_name,
      email,
      password: hashedPassword,
      role,
      num,
      country,
      code_tva,
      image,
      isActive: role !== 'super_admin' ? false : true,
    });

    await newAdmin.save();
    if (role !== 'super_admin') {
      const superAdmin = await adminModel.findOne({ role: 'super_admin' });
    
      if (superAdmin) {
        const token = jwt.sign(
          { adminId: newAdmin._id.toString() },
          process.env.JWT_ACC_ACTIVATE,
          { expiresIn: "1d" } // ou plus selon ton besoin
        );
        const isCurrentlyActive = newAdmin.isActive; // true ou false
        const actionText = isCurrentlyActive ? "Désactiver" : "Activer";
        const actionColor = isCurrentlyActive ? "#dc3545" : "#28a745";
        const toggleLink = `${process.env.APP_URL_API}/admin/admin/toggle-activation/${newAdmin._id}/${token}`;
        const superAdminOptions = {
          from: "ExypnoTech@exypnotech-es.com",
          to: superAdmin.email,
          subject: "Nouveau compte administrateur à activer",
          html: `
            <div style="max-width: 700px; margin:auto; border: 5px solid #ddd; padding: 30px 20px; font-size: 110%;">
              <h2 style="text-align: center; text-transform: uppercase; color: blue;">Nouveau compte admin en attente</h2>
              <p>L'administrateur suivant a été enregistré :</p>
              <ul>
                <li><strong>Email :</strong> ${email}</li>
                <li><strong>Rôle :</strong> ${role}</li>
                <li><strong>Entreprise :</strong> ${company_name}</li>
                <li><strong>Statut actuel :</strong> ${isCurrentlyActive ? "Actif" : "Inactif"}</li>
              </ul>
              <p>Cliquer sur le bouton ci-dessous pour ${actionText.toLowerCase()} ce compte :</p>
              <a href="${toggleLink}" style="display: inline-block; padding: 10px 20px; background-color: ${actionColor}; color: white; text-decoration: none; font-weight: bold; border-radius: 5px;">${actionText}</a>
            </div>
          `
        };
    
        transporter.sendMail(superAdminOptions, (err, info) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ msg: err.message });
          }
        });
      }
    }
    return res.status(201).json({ message: "Admin enregistré avec succès. En attente d'activation par un super admin." });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur.", error });
  }
});



// ✅ Connexion admin
// 🚀 Route de connexion d'un admin
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Email not found." });
    }

    if (!admin.isActive) {
      return res.status(400).json({ message: "Your account is not activated. Please contact the administrator." });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password." });
    }

    const token = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({ message: "Login successful.", token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred during login.", error });
  }
});

// ✅ Inscription admin
router.get("/admin/toggle-activation/:id/:token", async (req, res) => {
  try {
    const { id, token } = req.params;

    // Vérifie et décode le token
    const decoded = jwt.verify(token, process.env.JWT_ACC_ACTIVATE);

    if (decoded.adminId !== id) {
      return res.status(403).send("Token invalide ou expiré.");
    }

    const admin = await adminModel.findById(id);
    if (!admin) {
      return res.status(404).send("Admin introuvable.");
    }

    // Toggle de isActive
    admin.isActive = !admin.isActive;
    await admin.save();

    const statusText = admin.isActive ? "activé" : "désactivé";

    return res.send(`Le compte a été ${statusText} avec succès.`);
  } catch (err) {
    return res.status(400).send("Lien invalide ou expiré.");
  }
});
// ✅ Oubli de mot de passe
router.post("/admin/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    let foundAdmin = await adminModel.findOne({ email });
    if (!foundAdmin) {
      return res.status(400).json({ message: "Cet email n'existe pas." });
    }

    let token = randomToken(20);

    // Envoyer email avec lien de réinitialisation
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Réinitialisation du mot de passe",
      html: `<p>Pour réinitialiser votre mot de passe, cliquez sur <a href='${process.env.APP_URL_CLIENT}/auth/reset-password?token=${token}&email=${email}'>ce lien</a>.</p>`,
    });

    await passwordResetModel.create({ email: foundAdmin.email, token, created_at: new Date() });

    return res.status(200).json({ message: "Email de réinitialisation envoyé." });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur.", error });
  }
});

// ✅ Réinitialisation de mot de passe
// 🚀 Route de réinitialisation de mot de passe pour admin
router.post("/admin/reset-password", async (req, res) => {
  try {
    const { email, token, password, password_confirmation } = req.body;

    // Find the password reset token in the database
    let foundToken = await passwordResetModel.findOne({ email, token });

    if (!foundToken) {
      return res.status(400).json({ message: "Jeton invalide ou expiré." });
    }

    // Check if the token has expired (assuming you store a createdAt field)
    const tokenExpiryTime = 60 * 60 * 1000; // 1 hour expiry time
    const currentTime = Date.now();

    if (currentTime - foundToken.created_at > tokenExpiryTime){
      return res.status(400).json({ message: "Jeton expiré." });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères." });
    }

    // Check if passwords match
    if (password !== password_confirmation) {
      return res.status(400).json({ message: "Les mots de passe ne correspondent pas." });
    }

    // Check if the email exists in the adminModel (optional, but a good practice)
    const adminUser = await adminModel.findOne({ email });
    if (!adminUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update the admin's password
    await adminModel.updateOne({ email }, { $set: { password: hashedPassword } });

    // Delete the used token
    await passwordResetModel.deleteOne({ email });

    return res.status(200).json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur.", error });
  }
});

router.post("/admin/update-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.userId;

    // ⬇️ Sélectionne explicitement le champ 'password'
    const user = await adminModel.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }
console.log("currentPassword:", currentPassword);
console.log("user.password (hashed):", user?.password);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe actuel incorrect." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Les mots de passe ne correspondent pas." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.updated_at = Date.now();
    await user.save();

    res.status(200).json({ message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});


export default router;
