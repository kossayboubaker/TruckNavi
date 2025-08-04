import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import randomToken from "random-token";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { userModel } from "../../schemas/user.schema";
import { passwordResetModel } from "../../schemas/passwordResets.schema";

dotenv.config();
const router = express.Router();

// 🚀 Transporteur d'email pour mot de passe oublié
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🚀 Route d'inscription d'un utilisateur
router.post("/user/register", async (req, res) => {
  try {
    const { FirstName, LastName, email, password, role, profile_image, numero, country } = req.body;

    let existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    const validRoles = ["chauffeur", "gestionnaire", "client", "mecanicien", "operateur_logistique"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Le rôle '${role}' n'est pas valide.` });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      FirstName,
      LastName,
      email,
      password: hashedPassword,
      role,
      profile_image,
      numero,
      country,
    });

    await newUser.save();

    return res.status(201).json({ message: "Utilisateur enregistré avec succès." });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur.", error });
  }
});

// 🚀 Route de connexion d'un utilisateur
router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    let foundUser = await userModel.findOne({ email });
    if (!foundUser) {
      return res.status(400).json({ message: "Utilisateur non trouvé." });
    }

    const validPassword = await bcrypt.compare(password, foundUser.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Mot de passe invalide." });
    }

    const token = jwt.sign(
      { id: foundUser.id, email: foundUser.email, role: foundUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      token_type: "Bearer",
      expires_in: "24h",
      access_token: token,
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur.", error });
  }
});

// 🚀 Route mot de passe oublié pour utilisateur
router.post("/user/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    let foundUser = await userModel.findOne({ email });
    if (!foundUser) {
      return res.status(400).json({ message: "Cet email n'existe pas." });
    }

    let token = randomToken(20);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Réinitialisation du mot de passe",
      html: `<p>Pour réinitialiser votre mot de passe, cliquez sur <a href='${process.env.APP_URL_CLIENT}/reset-password?token=${token}&email=${email}'>ce lien</a>.</p>`,
    });

    await passwordResetModel.create({ email: foundUser.email, token, created_at: new Date() });

    return res.status(200).json({ message: "Email de réinitialisation envoyé." });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur.", error });
  }
});

// 🚀 Route de réinitialisation de mot de passe pour utilisateur
router.post("/user/reset-password", async (req, res) => {
  try {
    const { email, token, password, password_confirmation } = req.body;

    let foundToken = await passwordResetModel.findOne({ email, token });
    if (!foundToken) {
      return res.status(400).json({ message: "Jeton invalide ou expiré." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères." });
    }

    if (password !== password_confirmation) {
      return res.status(400).json({ message: "Les mots de passe ne correspondent pas." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await userModel.updateOne({ email }, { $set: { password: hashedPassword } });
    await passwordResetModel.deleteOne({ email });

    return res.status(200).json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur.", error });
  }
});

export default router;
