import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import randomToken from "random-token";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import { User } from "../../model/user.js";
import { Manager } from "../../model/manager.js";
import { Driver } from "../../model/driver.js";
import { Company } from "../../model/company.js";
import { Notification } from "../../model/notification.js";
import { passwordResetModel } from "../../model/passwordResets.js";
import multer from 'multer';
import path from 'path';
import fs from "fs";
import { authenticate } from "../../auth/middelware.js";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { io } from "../../index.js"; 
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

// ✅ Google Strategy avec User (adapté au modèle actuel)
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "/user/auth/google/callback",
//       scope: ["profile", "email"],
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         // Vérifie si l'utilisateur existe déjà
//         const email = profile.emails[0].value.toLowerCase();
//         let user = await User.findOne({ email_user: email });

//         if (user) return done(null, user);

//         // Crée un utilisateur avec un rôle par défaut (ex: driver)
//         const newUser = new User({
//           FirstName: profile.name?.givenName || "Google",
//           LastName: profile.name?.familyName || "User",
//           email_user: email,
//           password: await bcrypt.hash(randomToken(20), 10),
//           role: "driver", // ou "manager", selon ta logique métier
//           country: "",
//           num_user: null,
//           isActive: true, // ou false selon ton processus de validation
//         });

//         await newUser.save();
//         return done(null, newUser);
//       } catch (error) {
//         return done(error, null);
//       }
//     }
//   )
// );


passport.serializeUser((User, done) => done(null, User.id));
passport.deserializeUser(async (id, done) => {
  try {
    const User = await User.findById(id);
    done(null, User);
  } catch (error) {
    done(error, null);
  }
});
// Middleware pour vérifier l'authentification

  
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

router.use(express.urlencoded({ extended: true }));

router.all("/validate-driver/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const tokenData = activationTokens.get(token);
    if (!tokenData) {
      return res.status(400).send("Lien invalide ou expiré.");
    }

    const { driverId, managerEmail, driverEmail } = tokenData;

    if (req.method === "GET") {
      // Afficher les boutons HTML dans une interface simple
      return res.send(`
        <html>
          <head><title>Validation du Chauffeur</title></head>
          <body style="font-family: Arial; text-align: center; margin-top: 50px;">
            <h2>Souhaitez-vous approuver ou refuser ce chauffeur ?</h2>
            <p><strong>Driver:</strong> ${driverEmail}</p>
            <p><strong>Manager:</strong> ${managerEmail}</p>
            <form method="POST">
              <button type="submit" name="action" value="approve"
                style="background-color:green;color:white;padding:10px 20px;border:none;border-radius:5px;margin-right:10px;">
                ✅ Approuver
              </button>
              <button type="submit" name="action" value="reject"
                style="background-color:red;color:white;padding:10px 20px;border:none;border-radius:5px;">
                ❌ Refuser
              </button>
            </form>
          </body>
        </html>
      `);
    }

    // Traitement POST après clic
    const { action } = req.body;
    const isActive = action === "approve";

    const updatedDriver = await Driver.findByIdAndUpdate(
      driverId,
      { isActive },
      { new: true }
    );

    const htmlMessage = `
      <h3>Driver account ${isActive ? "approved ✅" : "rejected ❌"}</h3>
      <p><strong>Driver email:</strong> ${driverEmail}</p>
      <p><strong>Manager email:</strong> ${managerEmail}</p>
      <p>Status: ${isActive ? "<span style='color:green'>Activated</span>" : "<span style='color:red'>Rejected</span>"}</p>
    `;

    await transporter.sendMail({
      from: `"ExypnoTech" <${process.env.EMAIL_USER}>`,
      to: [driverEmail, managerEmail],
      subject: `Driver Account ${isActive ? "Approved" : "Rejected"}`,
      html: htmlMessage,
    });

    activationTokens.delete(token);

    res.send(`
      <html>
        <body style="text-align: center; margin-top: 50px;">
          <h2>Le compte du chauffeur a été ${isActive ? "✅ activé" : "❌ refusé"}.</h2>
          <p>Un email de notification a été envoyé au manager et au chauffeur.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Erreur validation chauffeur:", error);
    res.status(500).send("Erreur serveur.");
  }
});



// 👉 Route : Créer Super Admin + Company + envoi email
router.post("/register-super-admin", async (req, res) => {
  try {
    const {
      FirstName,
      LastName,
      email_user,
      password,
      num_user,
      country,
      company_name,
      campany_email,
      code_tva,
      Campany_adress,
      num_campany,
      representant_legal,
      image_company,
    } = req.body;

    // Vérifie si le mail super admin existe déjà
    const existingUser = await User.findOne({ email_user });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    // Vérifie si la société existe déjà
    const existingCompany = await Company.findOne({ company_name });
    if (existingCompany) {
      return res.status(400).json({ message: "Cette société existe déjà." });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de la société
    const newCompany = new Company({
      company_name,
      campany_email,
      code_tva,
      Campany_adress,
      num_campany,
      representant_legal,
      image_company,

    });
    await newCompany.save();

    // Création du super admin
    const newUser = new User({
      FirstName,
      LastName,
      email_user,
      password: hashedPassword,
      role: "super_admin",
      num_user,
      country,
      isActive: true,
      company: newCompany._id, // ✅ Association super admin -> société

    });
    await newUser.save();

    // Envoi d'email de confirmation
    const mailOptions = {
      from: `"ExypnoTech" <${process.env.EMAIL_USER}>`,
      to: email_user,
      subject: "Your Super Admin Account Has Been Created Successfully",
      html: `
        <h3>Welcome ${FirstName} ${LastName},</h3>
        <p>Your account has been created for <strong>${company_name}</strong>.</p>
        <p>Login using: <strong>${email_user}</strong>.</p>
        <p>Thanks,<br/>The ExypnoTech Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "Super Admin et entreprise créés avec succès." });
  } catch (error) {
    console.error("Erreur de création super admin :", error);
    res.status(500).json({ message: "Erreur lors de la création du compte super admin." });
  }
});

router.post("/login", async (req, res) => {
  const { email_user, password } = req.body;

  try {
    const user = await User.findOne({ email_user });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });
const populatedUser = await User.findById(user._id).populate("company", "company_name image_campany");

    if (!user.isActive) {
  return res.status(403).json({ message: "Votre compte est inactif. Veuillez contacter l'administrateur." });
}

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Mot de passe incorrect." });

    // Générer le token JWT
    const token = jwt.sign(
  {
    _id: user._id,
    role: user.role,
    email_user: user.email_user, // 👈 essentiel
FirstName: user.FirstName,
  LastName: user.LastName,  },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);


    // Stocker dans un cookie sécurisé
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true en prod avec HTTPS
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 jour
    });

    // Répond avec le rôle pour rediriger
    res.status(200).json({ message: "Connexion réussie", role: user.role });
  } catch (error) {
    console.error("Erreur de login :", error);
    res.status(500).json({ message: "Erreur serveur lors de la connexion." });
  }
});

// router.post("/login", async (req, res) => {
//   const { email_user, password } = req.body;

//   try {
//     const user = await User.findOne({ email_user });
//     if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

//     if (!user.isActive) {
//       return res.status(403).json({ message: "Votre compte est inactif. Veuillez contacter l'administrateur." });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(401).json({ message: "Mot de passe incorrect." });

//     const token = jwt.sign(
//       {
//         _id: user._id,
//         role: user.role,
//         email_user: user.email_user,
//         FirstName: user.FirstName,
//         LastName: user.LastName,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       maxAge: 24 * 60 * 60 * 1000,
//     });

//     // 🔁 Récupère la société liée
//     const company = await Company.findById(user.company).select("company_name image_campany");

//     // ✅ Retour complet
//     res.status(200).json({
//       message: "Connexion réussie",
//       user: {
//         _id: user._id,
//         role: user.role,
//         email_user: user.email_user,
//         FirstName: user.FirstName,
//         LastName: user.LastName,
//         image: user.image,
//         company,
//       },
//       token,
//     });
//   } catch (error) {
//     console.error("Erreur de login :", error);
//     res.status(500).json({ message: "Erreur serveur lors de la connexion." });
//   }
// });


router.post("/create-user", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Accès refusé. Seuls les super admins peuvent créer des utilisateurs." });
    }

    const { email_user, role } = req.body;

    if (!["manager", "driver"].includes(role)) {
      return res.status(400).json({ message: "Le rôle doit être soit 'manager' soit 'driver'." });
    }

    const existingUser = await User.findOne({ email_user });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    const rawPassword = randomToken(10);
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    let newUser;

    if (role === "manager") {
      newUser = new Manager({
        FirstName: "",
        LastName: "",
        email_user,
        password: hashedPassword,
        role,
        Post: "Fleet Manager",
        country: "",
        num_user: null,
        isActive: true, // en attente d'activation
        company: req.user.company, // ✅ Association à la société du super admin
      });
    } else if (role === "driver") {
      newUser = new Driver({
        FirstName: "",
        LastName: "",
        email_user,
        password: hashedPassword,
        role,
        status: "available",
        country: "",
        num_user: "",
        isActive: true, // en attente d'activation
        company: req.user.company, // ✅ Association à la société du super admin
        createdBy:null,
      });
    }

    await newUser.save();

    // Lien de login pour l'utilisateur
    const loginURL = `${process.env.APP_URL_CLIENT || "http://localhost:3000"}/auth/login`;

    // Mail à envoyer à l'utilisateur créé
    const mailOptions = {
      from: `"ExypnoTech" <${process.env.EMAIL_USER}>`,
      to: email_user,
      subject: "Your user account has been created",
      html: `
        <h3>Welcome to ExypnoTech</h3>
        <p>Your user account has been successfully created.</p>
        <p><strong>Email:</strong> ${email_user}</p>
        <p><strong>Password:</strong> ${rawPassword}</p>
        <p>You can log in here: <a href="${loginURL}">${loginURL}</a></p>
        <p>Thank you,<br/>The ExypnoTech Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: `Utilisateur ${role} créé avec succès. Un email avec les identifiants a été envoyé à ${email_user}.` });
  } catch (error) {
    console.error("Erreur de création d'utilisateur :", error);
    res.status(500).json({ message: "Erreur lors de la création de l'utilisateur." });
  }
});
router.post("/forgot-password", async (req, res) => {
  try {
     const { email_user } = req.body;

  const user = await User.findOne({ email_user });
  if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

  const token = randomToken(30); // ou JWT si vous préférez

  // Enregistrement du token dans la base
  await passwordResetModel.create({
    email_user,
    token,
    created_at: Date.now(),
  });

    // Crée le lien de réinitialisation
  const resetLink = `http://localhost:3000/auth/reset-password?token=${token}&email=${email_user}`;

    // Prépare le mail
    const mailOptions = {
      from: `"ExypnoTech" <${process.env.EMAIL_USER}>`,
      to: email_user,
      subject: "Réinitialisation de votre mot de passe",
      html: `
        <p>Bonjour,</p>
        <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Ce lien expirera dans 1 heure.</p>
        <p>Merci,<br>L’équipe ExypnoTech</p>
      `,
    };

    // Envoie le mail
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "E-mail de réinitialisation envoyé avec succès." });
  } catch (error) {
    console.error("Erreur de réinitialisation :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});
router.post("/reset-password", async (req, res) => {
  try {
    const {email_user , token, password, password_confirmation } = req.body;

    // Find the password reset token in the database
    let foundToken = await passwordResetModel.findOne({email_user , token });

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
    const user = await User.findOne({ email_user });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update the admin's password
    await User.updateOne({ email_user }, { $set: { password: hashedPassword } });

    // Delete the used token
    await passwordResetModel.deleteOne({ email_user });

    return res.status(200).json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur.", error });
  }
});

router.get("/company/users", authenticate, async (req, res) => {
  try {
    const requestingUser = req.user;

    if (requestingUser.role !== "super_admin") {
      return res.status(403).json({
        message: "Seul le super_admin peut accéder à cette ressource.",
      });
    }

    if (!requestingUser.company) {
      return res.status(400).json({
        message: "Ce super_admin n'est lié à aucune entreprise.",
      });
    }

    // 🔄 Récupérer tous les utilisateurs liés à la même entreprise (via ObjectId)
    const allUsers = await User.find({ company: requestingUser.company })
      .populate("company", "company_name campany_email Campany_adress") // sélectionne les champs que tu veux voir
      .select("FirstName LastName email_user role country isActive created_at image company");

    // 🔽 Trier : super_admins en premier, puis managers, puis drivers
    const order = { super_admin: 0, manager: 1, driver: 2 };
    const usersSorted = allUsers.sort((a, b) => order[a.role] - order[b.role]);

    res.status(200).json(usersSorted);
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des utilisateurs." });
  }
});
// router.get("/getProfile", authenticate, async (req, res) => {
//   try {
//     console.log("User authentifié :", req.user);
//      const userId = req.user._id;

//     // Charge l'utilisateur avec son rôle (discriminator)
//     let user;

//     if (req.user.role === "manager") {
//       user = await Manager.findById(userId).select("-password -refreshToken -resetPasswordToken -resetPasswordExpires")     .populate("company", "company_name "); // uniquement les champs utiles
//     } else if (req.user.role === "driver") {
//       user = await Driver.findById(userId).select("-password -refreshToken -resetPasswordToken -resetPasswordExpires")    .populate("company", "company_name "); // uniquement les champs utiles
//     } else if (req.user.role === "super_admin") {
//       user = await User.findById(userId).select("-password -refreshToken -resetPasswordToken -resetPasswordExpires")    .populate("company", "company_name "); // uniquement les champs utiles

//     } else {
//       return res.status(400).json({ message: "Role non reconnu." });
//     }

//     if (!user) {
//       return res.status(404).json({ message: "Utilisateur non trouvé." });
//     }

//     res.json(user);
//   } catch (error) {
//     console.error("Erreur récupération user:", error);
//     res.status(500).json({ message: "Erreur serveur." });
//   }
// });
router.get("/getProfile", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    let user;

    if (req.user.role.toLowerCase() === "manager") {
      user = await User.findOne({ _id: userId, __t: "Manager" })
        .select("-password -refreshToken -resetPasswordToken -resetPasswordExpires")
        .populate("company", "company_name image_campany");
    } else if (req.user.role.toLowerCase() === "driver") {
      user = await User.findOne({ _id: userId, __t: "Driver" })
        .select("-password -refreshToken -resetPasswordToken -resetPasswordExpires")
        .populate("company", "company_name image_campany");
    } else if (req.user.role.toLowerCase() === "super_admin") {
      user = await User.findOne({ _id: userId, __t: { $exists: false } }) // Super admin n'a pas de __t
        .select("-password -refreshToken -resetPasswordToken -resetPasswordExpires")
        .populate("company", "company_name image_campany");
    } else {
      return res.status(400).json({ message: "Unrecognized role." });
    }

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    res.json(user);
  } catch (error) {
    console.error("Erreur récupération user:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// Route modifiée avec multer
router.put("/updateProfile",authenticate,upload.single("image"), // Image dans le champ "image"
  async (req, res) => {
    try {
      const userId = req.user._id;
      const role = req.user.role;
      const updates = req.body;

      // Sécurité : on interdit modification du mot de passe et rôle
      delete updates.role;
      delete updates.password;

      // Préparer updates
      const updatesToApply = { ...updates };
delete updatesToApply.company;

      // Gestion image
      if (req.file) {
        let userModel;

        switch (role) {
          case "manager":
            userModel = Manager;
            break;
          case "driver":
            userModel = Driver;
            break;
          case "super_admin":
            userModel = User;
            break;
          default:
            return res.status(400).json({ message: "Rôle invalide." });
        }

        const currentUser = await userModel.findById(userId);
        if (currentUser && currentUser.image) {
          const oldImagePath = path.join(uploadDir, currentUser.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

        updatesToApply.image = req.file.filename;
      }

      // ✅ Quand le profil est mis à jour, l’utilisateur a complété ses infos → on supprime `mustChangePassword`
      updatesToApply.mustChangePassword = false;

      let updatedUser;

      switch (role) {
        case "manager":
          updatedUser = await Manager.findByIdAndUpdate(userId, updatesToApply, {
            new: true,
            runValidators: true,
          }).select("-password -refreshToken -resetPasswordToken -resetPasswordExpires");
          break;

        case "driver":
          updatedUser = await Driver.findByIdAndUpdate(userId, updatesToApply, {
            new: true,
            runValidators: true,
          }).select("-password -refreshToken -resetPasswordToken -resetPasswordExpires");
          break;

        case "super_admin":
          updatedUser = await User.findByIdAndUpdate(userId, updatesToApply, {
            new: true,
            runValidators: true,
          }).select("-password -refreshToken -resetPasswordToken -resetPasswordExpires");
          break;

        default:
          return res.status(400).json({ message: "Rôle inconnu." });
      }

      if (!updatedUser) {
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }

      res.status(200).json({
        message: "✅ Profil mis à jour avec succès.",
        user: updatedUser,
      });
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du profil :", error);
      res.status(500).json({ message: "Erreur serveur." });
    }
  }
);

router.put("/updatePassword", authenticate, async (req, res) => {
  try {
      const userId = req.user._id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Vérifie que tous les champs sont présents
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    // Vérifie que les nouveaux mots de passe correspondent
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Les nouveaux mots de passe ne correspondent pas." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Ancien mot de passe incorrect." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    user.mustChangePassword = true; // ✅ L'utilisateur peut accéder au dashboard maintenant
    await user.save();

    res.json({ message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    console.error("Erreur mise à jour mot de passe:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});
//company
router.get('/getProfileCompany', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: "Accès refusé, rôle non autorisé." });
    }

    // Exemple : on suppose qu'il y a une seule société (à adapter si plusieurs)
    const company = await Company.findOne();

    if (!company) {
      return res.status(404).json({ message: "Société non trouvée." });
    }

    res.json(company);
  } catch (error) {
    console.error("Erreur récupération company:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

router.put('/updateCompany',authenticate,upload.single("image_campany")
, // middleware upload fichier image
async (req, res) => {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: "Accès refusé, rôle non autorisé." });
      }

      const updates = req.body;

      // Préparer l'objet de mise à jour
      const updatesToApply = { ...updates, updated_at: Date.now() };

      // Gestion de l'image uploadée
      if (req.file) {
        const company = await Company.findOne();

        if (company && company.image_campany) {
          const oldImagePath = path.join(uploadDir, company.image_campany);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

        updatesToApply.image_campany = req.file.filename;
      }
      // Mettre à jour la société (on suppose qu’il n’y a qu’une seule société)
      const updatedCompany = await Company.findOneAndUpdate({}, updatesToApply, {
        new: true,
        runValidators: true,
      });

      if (!updatedCompany) {
        return res.status(404).json({ message: "Société non trouvée." });
      }

      res.json({ message: "Société mise à jour avec succès.", company: updatedCompany });
    } catch (error) {
      console.error("Erreur mise à jour company:", error);
      res.status(500).json({ message: "Erreur serveur." });
    }
  }
);



//manager

router.get("/manager/drivers", authenticate, async (req, res) => {
  try {
    const requestingUser = req.user;

    if (requestingUser.role !== "manager") {
      return res.status(403).json({ message: "Access denied. Only managers can access this list." });
    }

    const drivers = await Driver.find({ createdBy: requestingUser._id })
  .select("FirstName LastName email_user role status  num country isActive image created_at");


    res.status(200).json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ message: "Server error while fetching drivers." });
  }
});




router.put("/assign-driver/:managerId", authenticate, async (req, res) => {
  const { managerId } = req.params;
  const { driverId } = req.body;

  if (req.user.role !== "super_admin") {
    return res.status(403).json({ message: "Accès refusé." });
  }

  if (!driverId) {
    return res.status(400).json({ message: "driverId est requis." });
  }
if (driverId.createdBy?.toString() === managerId) {
  return res.status(400).json({
    message: "Ce chauffeur a déjà été créé par ce manager. Impossible de l'affecter à nouveau."
  });}
  try {
    const manager = await User.findOne({ _id: managerId, role: "manager" });
    if (!manager) {
      return res.status(404).json({ message: "Manager introuvable ou invalide." });
    }

    // Met à jour le chauffeur avec createdBy
    let updatedDriver = await User.findByIdAndUpdate(
      driverId,
      { createdBy: manager._id },
      { new: true }
    );

    if (!updatedDriver) {
      return res.status(404).json({ message: "Chauffeur non trouvé." });
    }

    // Populate le champ manager
    updatedDriver = await User.findById(updatedDriver._id).populate(
      "createdBy",
      "FirstName LastName email_user"
    );

    res.status(200).json({
      message: "✅ Driver affecté avec succès au manager.",
      driver: updatedDriver,
    });
  } catch (error) {
    console.error("❌ Erreur :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});


router.get("/drivers", authenticate, async (req, res) => {
  if (req.user.role !== "super_admin") {
    return res.status(403).json({ message: "Accès refusé." });
  }

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";
    const managerId = req.query.managerId;

console.log("👉 Manager ID reçu dans la query :", managerId);

    const query = {
      role: "driver",
      $or: [
        { FirstName: { $regex: search, $options: "i" } },
        { LastName: { $regex: search, $options: "i" } },
        { email_user: { $regex: search, $options: "i" } },
      ]
    };

    // Ajoute une condition pour exclure les drivers créés par ce manager
   if (managerId) {
  query.$and = [
    {
      $or: [
        { createdBy: { $ne: managerId } },
        { createdBy: { $exists: false } },
        { createdBy: null }
      ]
    }
  ];
}


    const totalDrivers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalDrivers / limit);

    const drivers = await User.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .select("FirstName LastName email_user role createdBy") // tu peux retirer `createdBy` si inutile
      .lean();

    res.json({ drivers, totalPages });
  } catch (error) {
    console.error("Erreur récupération chauffeurs :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});


const activationTokens = new Map();



router.post("/manager/create-driver", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ message: "Access denied. Only managers can create drivers." });
    }
    console.log("emailManager :", req.user.email_user);
    const { email_user } = req.body;
    const exists = await User.findOne({ email_user });
    if (exists) {
      return res.status(400).json({ message: "This email is already in use." });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
     console.log("Manager company:", req.user.company);

    const newDriver = new Driver({
      FirstName: "",
      LastName: "",
      email_user,
      password: tempPassword,
      role: "driver",
      status: "available",
      country: "",
      num_user: null,
      company: req.user.company, // ✅ Associe le driver à la société du manager
      isActive: false,
      createdBy: req.user._id, // 🔹 association avec le manager créateur

      
    });

    await newDriver.save();

    const token = uuidv4();
    activationTokens.set(token, {
      driverId: newDriver._id,
      managerId: req.user._id,
      driverEmail: email_user,
    });

    const acceptURL = `${process.env.APP_URL_API}/user/validate-driver/${token}/accept`;
    const refuseURL = `${process.env.APP_URL_API}/user/validate-driver/${token}/refuse`;

    const superAdmins = await User.find({ role: "super_admin" });

    if (!superAdmins || superAdmins.length === 0) {
      return res.status(500).json({ message: "No super_admins found to notify." });
    }

    const superAdminEmails = superAdmins.map(admin => admin.email_user).filter(Boolean);
    if (!superAdminEmails.length) {
  return res.status(500).json({ message: "Aucun super_admin avec un email valide trouvé." });
}
console.log("emailSuper_admin :", superAdminEmails);

    const mailOptions = {
      from: `"ExypnoTech" <${process.env.EMAIL_USER}>`,
      to: superAdminEmails,
      subject: "Souhaitez-vous approuver ou refuser ce chauffeur ?",
      html: `
        <h3>Souhaitez-vous approuver ou refuser ce chauffeur ?</h3>
        <p><strong>Driver :</strong> ${email_user}</p>
        <p><strong>Manager :</strong> ${req.user.email_user}</p>
        
        <p>
          <a href="${acceptURL}" style="padding: 10px 15px; background-color: green; color: white; text-decoration: none; border-radius: 5px;">✅ Valider</a>
          &nbsp;&nbsp;
          <a href="${refuseURL}" style="padding: 10px 15px; background-color: red; color: white; text-decoration: none; border-radius: 5px;">❌ Refuser</a>
        </p>
      `,
    };

    await transporter.sendMail(mailOptions);
const superAdmin = await User.findOne({ role: "super_admin" });
if (!superAdmin) {
  return res.status(500).json({ message: "No super_admin found to notify." });
}
console.log("nom_manager",req.user.FirstName);
// Créer une notification unique pour ce super_admin
const notif = new Notification({
  recipient: superAdmin._id,
  sender: req.user._id,
  type: "account_validation",
  title: "Demande de validation d’un chauffeur",
message: `
  Le manager <strong>${req.user.FirstName} ${req.user.LastName}</strong>
  souhaite créer le chauffeur <strong>${email_user}</strong>.
 Veuillez confirmer la création du compte ci-dessous :
`,
token,
  relatedEntity: newDriver._id,
  entityType: "User",
    seen: false, // ⬅️ pour indiquer que la notif n’est pas encore vue

});
await notif.save();

// Notification en temps réel
//io.emit(`notify:${superAdmin._id}`, notif);
io.to(superAdmin._id.toString()).emit("new_notification", notif);

   // req.io.to(superAdmin._id.toString()).emit("new_notification", notif);

    res.status(200).json({ message: "Request sent to super_admin(s) for validation." });
  } catch (error) {
    console.error("Error during driver creation request:", error);
    res.status(500).json({ message: "Server error." });
  }
});
// Valider le chauffeur
router.get("/validate-driver/:token/accept", async (req, res) => {
  const token = req.params.token;
  const data = activationTokens.get(token);

  if (!data) {
    return res.status(400).send("Token invalide ou expiré.");
  }

  const { driverId, managerId } = data;

  // Générer un mot de passe aléatoire
  const rawPassword = crypto.randomBytes(8).toString("hex"); // 16 caractères
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  // Activer le compte du chauffeur et mettre à jour son mot de passe
  const driver = await User.findByIdAndUpdate(
    driverId,
    { isActive: true, password: hashedPassword },
    { new: true }
  );

  // Activer le document driver aussi (si stocké séparément)
  await Driver.findByIdAndUpdate(driverId, { isActive: true });

  const manager = await User.findById(managerId);

  const loginURL = `${process.env.APP_URL_CLIENT || "http://localhost:3000"}/auth/login`;
console.log("driver.email_user",driver.email_user);
  // Mail à envoyer au chauffeur
  const mailOptions = {
    from: `"ExypnoTech" <${process.env.EMAIL_USER}>`,
    to: driver.email_user, // Récupéré depuis l'objet driver
    subject: "Votre compte a été activé",
    html: `
      <h3>Bienvenue sur ExypnoTech</h3>
      <p>Votre compte a été validé par l'administrateur.</p>
      <p><strong>Email :</strong> ${driver.email_user}</p>
      <p><strong>Mot de passe :</strong> ${rawPassword}</p>
      <p>Vous pouvez vous connecter ici : <a href="${loginURL}">${loginURL}</a></p>
      <p>Merci,<br/>L'équipe ExypnoTech</p>
    `,
  };

  await transporter.sendMail(mailOptions);

  // Notification pour le manager
  const notification = new Notification({
    recipient: manager._id,
    type: "account_validation",
    title: "Compte chauffeur validé",
    message: `Le super_admin a validé le compte du chauffeur : ${driver.email_user}`,
    relatedEntity: driver._id,
    entityType: "User",
  });

  await notification.save();
  req.io.to(manager._id.toString()).emit("new_notification", notification);

  // Supprimer le token après usage
  activationTokens.delete(token);

  res.send("✅ Le chauffeur a été validé avec succès et un e-mail lui a été envoyé.");
});

// Refuser le chauffeur
router.get("/validate-driver/:token/refuse", async (req, res) => {
  const token = req.params.token;
  const data = activationTokens.get(token);

  if (!data) {
    return res.status(400).send("Token invalide ou expiré.");
  }

const { driverId, managerId } = data;
  const driver = await User.findById(driverId);
  const manager = await User.findById(managerId);
  const notification = new Notification({
    recipient: manager._id,
    type: "account_validation",
    title: "Compte chauffeur refusé",
    message: `Le super_admin a refusé le compte du chauffeur: ${driver.email_user}`,
    relatedEntity: driver._id,
    entityType: "User",
  });
  await notification.save();
  req.io.to(manager._id.toString()).emit("new_notification", notification);

  await Driver.findByIdAndDelete(driverId);

  activationTokens.delete(token);
  res.send("❌ Le chauffeur a été refusé et supprimé.");
});
router.get("/notifications", authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});
// Marquer une notification comme vue
router.put("/notifications/:id/seen", authenticate, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { seen: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification introuvable" });
    res.json(notification);
  } catch (err) {
    console.error("Erreur PUT /notifications/:id/seen", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


// Supprimer un admin
router.delete("/user/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
});

// Avec middleware authenticate
router.get("/toggle-activation/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).send("Utilisateur introuvable.");

    const currentUser = req.user;
    console.log("Current user:", currentUser.role, currentUser._id);
console.log("Target user:", targetUser.role, targetUser._id);

async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: `"Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Failed to send email:", err); // 🔍 Add this
    throw err; // re-throw to trigger 500 in route
  }
}
    // ✅ Si super_admin : action directe
    if (currentUser.role === "super_admin") {
      targetUser.isActive = !targetUser.isActive;
      await targetUser.save();

      await sendEmail({
        to: targetUser.email_user,
        subject: "Changement du statut de votre compte",
        html: `<p>Votre compte a été ${targetUser.isActive ? "activé" : "désactivé"} par un super administrateur.</p>`,
      });

      return res.send(`Compte ${targetUser.isActive ? "activé" : "désactivé"} avec succès.`);
    }

    // ✅ Si admin : envoie une demande par email au super_admin
    if (currentUser.role === "manager" && targetUser.role === "driver") {
      const superAdmin = await User.findOne({ role: "super_admin" });
      if (!superAdmin) return res.status(404).send("Super administrateur introuvable.");

      const desiredStatus = !targetUser.isActive;
await sendEmail({
  to: superAdmin.email_user,
  subject: "Driver account activation/deactivation request",
  html: `
    <p>Administrator <strong>${currentUser.email_user}</strong> requests to <strong style="color:${desiredStatus ? 'green' : 'red'}">${desiredStatus ? 'activate' : 'deactivate'}</strong> the driver account <strong>${targetUser.email_user}</strong>.</p>
    
    <p>Please choose an action:</p>
    <a href="http://localhost:8080/user/activation-response/${targetUser._id}?action=approve" style="padding:10px 15px;background:#28a745;color:white;text-decoration:none;border-radius:5px;">✅ Approve</a>
    &nbsp;
    <a href="http://localhost:8080/user/activation-response/${targetUser._id}?action=reject" style="padding:10px 15px;background:#dc3545;color:white;text-decoration:none;border-radius:5px;">❌ Reject</a>
  `
});

      return res.status(202).send("Demande envoyée au super administrateur.");
    }

    return res.status(403).send("Action non autorisée.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur serveur.");
  }
});

router.get("/activation-response/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.query;

    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found.");

    if (action === "approve") {
      user.isActive = true;
      await user.save();

      return res.send(`✅ The account ${user.email_user} has been activated.`);
    } else if (action === "reject") {
      return res.send(`❌ The request has been rejected. The account ${user.email_user} remains ${user.isActive ? "active" : "inactive"}.`);
    } else {
      return res.status(400).send("Invalid action.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error.");
  }
});

router.post("/request-toggle-driver/:driverId", authenticate, async (req, res) => {
  try {
    const { driverId } = req.params;

    // Vérifie que l'utilisateur est admin
    if (!req.user.isAdmin) {
      return res.status(403).send("Seuls les administrateurs peuvent effectuer cette action.");
    }

    const driver = await User.findById(driverId);
    if (!driver || driver.role !== "driver") {
      return res.status(404).send("Driver introuvable.");
    }

    // Récupérer le super admin
    const superAdmin = await User.findOne({ role: "super_admin" });
    if (!superAdmin) {
      return res.status(404).send("Aucun super administrateur trouvé.");
    }

    // Créer un token de confirmation
    const token = jwt.sign({ driverId }, process.env.JWT_SECRET, { expiresIn: "15m" });

    // Créer l'URL de confirmation
    const confirmUrl = `http://localhost:8080/user/confirm-toggle-driver/${driverId}/${token}`;

    // Envoyer l'e-mail au super admin
    await sendEmail({
      to: superAdmin.email,
      subject: "Confirmation d'activation/désactivation d'un driver",
      text: `Un administrateur souhaite changer le statut du compte du driver ${driver.email}. Cliquez ici pour confirmer : ${confirmUrl}`,
    });

    res.send("Demande envoyée au super administrateur.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la demande.");
  }
});
router.get("/confirm-toggle-driver/:driverId/:token", async (req, res) => {
  try {
    const { driverId, token } = req.params;

    // Vérifie le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.driverId !== driverId) {
      return res.status(403).send("Token invalide.");
    }

    const driver = await User.findById(driverId);
    if (!driver || driver.role !== "driver") {
      return res.status(404).send("Driver introuvable.");
    }

    // Toggle du statut
    driver.isActive = !driver.isActive;
    await driver.save();

    const statusText = driver.isActive ? "activé" : "désactivé";
    return res.send(`Le compte du driver ${driver.email} a été ${statusText}.`);
  } catch (err) {
    return res.status(400).send("Lien invalide ou expiré.");
  }
});
router.get("/search", async (req, res) => {
  try {
    const {
      FirstName,
      LastName,
      email_user,
      role,
      num_user,
      country,
      isActive,
      created_at,
      updated_at,
      sortBy = "created_at",
      order = "desc",
      page = 1,
    } = req.query;

    const limit = 5;
    const skip = (parseInt(page) - 1) * limit;

    // --- Construction des filtres ---
    const filter = {};

    if (FirstName) filter.FirstName = { $regex: FirstName, $options: "i" };
    if (LastName) filter.LastName = { $regex: LastName, $options: "i" };
    if (email_user) filter.email_user = { $regex: email_user, $options: "i" };
    if (role) filter.role = role;
    if (num_user) filter.num_user = Number(num_user);
    if (country) filter.country = { $regex: country, $options: "i" };
    if (isActive !== undefined) {
      if (isActive === "Active") filter.isActive = true;
      else if (isActive === "Inactive") filter.isActive = false;
    }

    if (created_at) {
      const date = new Date(created_at);
      filter.created_at = { $gte: date, $lt: new Date(date.getTime() + 86400000) };
    }

    if (updated_at) {
      const date = new Date(updated_at);
      filter.updated_at = { $gte: date, $lt: new Date(date.getTime() + 86400000) };
    }

    // --- Tri personnalisé ---
    const sort = {};
    const allowedSortFields = ["FirstName", "LastName", "email_user", "isActive", "created_at", "updated_at"];

    if (allowedSortFields.includes(sortBy)) {
      sort[sortBy] = order === "asc" ? 1 : -1;
    } else {
      sort.created_at = -1; // tri par défaut
    }

    // --- Résultats paginés ---
    const total = await User.countDocuments(filter);
    const users = await User.find(filter).sort({ created_at: 1 }) // Pour trier du plus récent au plus ancien
  .skip((page - 1) * limit)
  .limit(limit);;

    const formattedUsers = users.map((user) => ({
      ...user.toObject(),
      isActive: user.isActive ? "Active" : "Inactive",
    }));

    res.json({
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalResults: total,
      results: formattedUsers,
    });

  } catch (err) {
    console.error("Erreur recherche avancée avec pagination :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});


// backend/routes/user.js
router.delete("/notifications/:id", authenticate, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Notification supprimée" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});



// ✅ Auto Login
// router.get("/auto-login", authenticate, async (req, res) => {
//   try {
//     const user = req.user;
//     let company = null;

//     // Récupération société si super_admin avec company renseignée
//     if (user.role === "super_admin") {
//       // Exemple : chercher la société créée par cet admin
//       company = await Company.findOne({ createdBy: user._id });
//     }

//     // Étape 1 : Forcer changement de mot de passe
//     const mustChangePassword = !user.mustChangePassword;

//     // Étape 2 : Vérification des informations utilisateur
//     const profileIncomplete =
//       (user.role === "manager" || user.role === "driver"|| user.role === "super_admin") &&
//       (!user.FirstName || !user.LastName || !user.num_user || !user.country || !user.image);

//     if (profileIncomplete) {
//       console.log("Profil utilisateur incomplet:");
//       if (!user.FirstName) console.log("- FirstName manquant");
//       if (!user.LastName) console.log("- LastName manquant");
//       if (!user.num_user) console.log("- num_user manquant");
//       if (!user.country) console.log("- country manquant");
//       if (!user.image) console.log("- image manquante");
//     }

//     // Étape 3 : Vérification des informations société si super_admin
//     let companyIncomplete = false;

//     if (user.role === "super_admin") {
//       if (!company) {
//         companyIncomplete = true;
//         console.log("Profil entreprise incomplet: - Aucune société trouvée.");
//       } else {
//         companyIncomplete =
//           !company.company_name ||
//           !company.campany_email ||
//           !company.Campany_adress ||
//           !company.num_campany ||
//           !company.image_campany;

//         if (!company.company_name) console.log("- company_name manquant");
//         if (!company.campany_email) console.log("- campany_email manquant");
//         if (!company.Campany_adress) console.log("- Campany_adress manquant");
//         if (!company.num_campany) console.log("- num_campany manquant");
//         if (!company.image_campany) console.log("- image_campany manquante");
//       }
//     }

//     // ✅ Conditions d'accès au dashboard
//     const canAccessDashboard =
//       !mustChangePassword &&
//       !profileIncomplete &&
//       !(user.role === "super_admin" && companyIncomplete && profileIncomplete);

//     res.status(200).json({
//       user,
//       company,
//       mustChangePassword,
//       profileIncomplete,
//       companyIncomplete,
//       canAccessDashboard, // ✅ Booléen qui dit si accès autorisé ou non
//     });
//   } catch (error) {
//     console.error("❌ Erreur auto-login :", error);
//     res.status(500).json({ message: "Erreur serveur" });
//   }
// });
router.get("/auto-login", authenticate, async (req, res) => {
  try {
    const user = req.user;
    let company = null;

    if (user.role === "super_admin") {
      company = await Company.findOne({ createdBy: user._id });
    } else {
      // Associe la company à tous les utilisateurs
      company = await Company.findOne({ _id: user.company });
    }

    const mustChangePassword = !user.mustChangePassword;

    const profileIncomplete =
      ["manager", "driver", "super_admin"].includes(user.role) &&
      (!user.FirstName || !user.LastName || !user.num_user || !user.country || !user.image);

    let companyIncomplete = false;

    if (user.role === "super_admin") {
      if (!company) {
        companyIncomplete = true;
      } else {
        companyIncomplete =
          !company.company_name ||
          !company.campany_email ||
          !company.Campany_adress ||
          !company.num_campany ||
          !company.image_campany;
      }
    }

    const canAccessDashboard =
      !mustChangePassword &&
      !profileIncomplete &&
      !(user.role === "super_admin" && companyIncomplete && profileIncomplete);

    res.status(200).json({
      user,
      company,
      mustChangePassword,
      profileIncomplete,
      companyIncomplete,
      canAccessDashboard,
    });
  } catch (error) {
    console.error("❌ Erreur auto-login :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// router.get("/auto-login", authenticate, async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id).populate("company");
//     const company = user.company || null;

//     const mustChangePassword = !user.mustChangePassword;

//     const profileIncomplete =
//       (["super_admin", "manager", "driver"].includes(user.role)) &&
//       (!user.FirstName || !user.LastName || !user.num_user || !user.country || !user.image);

//     if (profileIncomplete) {
//       console.log("Profil utilisateur incomplet:");
//       if (!user.FirstName) console.log("- FirstName manquant");
//       if (!user.LastName) console.log("- LastName manquant");
//       if (!user.num_user) console.log("- num_user manquant");
//       if (!user.country) console.log("- country manquant");
//       if (!user.image) console.log("- image manquante");
//     }

//     let companyIncomplete = false;

//     if (user.role === "super_admin" && company) {
//       companyIncomplete =
//         !company.company_name ||
//         !company.campany_email ||
//         !company.Campany_adress ||
//         !company.num_campany ||
//         !company.image_campany;

//       if (companyIncomplete) {
//         console.log("Profil entreprise incomplet:");
//         if (!company.company_name) console.log("- company_name manquant");
//         if (!company.campany_email) console.log("- campany_email manquant");
//         if (!company.Campany_adress) console.log("- Campany_adress manquant");
//         if (!company.num_campany) console.log("- num_campany manquant");
//         if (!company.image_campany) console.log("- image_campany manquante");
//       }
//     }

//     const canAccessDashboard =
//       !mustChangePassword &&
//       !profileIncomplete &&
//       !(user.role === "super_admin" && companyIncomplete && profileIncomplete);

//     res.status(200).json({
//       user,
//       company,
//       mustChangePassword,
//       profileIncomplete,
//       companyIncomplete,
//       canAccessDashboard,
//     });
//   } catch (error) {
//     console.error("❌ Erreur auto-login :", error);
//     res.status(500).json({ message: "Erreur serveur" });
//   }
// });





// ✅ Logout
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Déconnexion réussie." });
});

export default router;
