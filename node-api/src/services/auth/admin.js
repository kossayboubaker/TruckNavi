import dotenv from "dotenv";
import nodemailer from "nodemailer";
import randomToken from "random-token";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userModel } from "../../schemas/user.schema";
import { passwordResetModel } from "../../schemas/passwordResets.schema";
import { adminModel } from "../../schemas/admin.schema"; 

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🚀 Login Handler (Utilisateurs et Administrateurs)
export const loginRouteHandler = async (req, res) => {
  const { email, password, role } = req.body;

  let foundUser;
  
  if (["super_admin", "admin_flotte", "admin_client", "admin_support"].includes(role)) {
    foundUser = await adminModel.findOne({ email });
  } else {
    foundUser = await userModel.findOne({ email });
  }

  if (!foundUser) {
    return res.status(400).json({ errors: [{ detail: "Utilisateur non trouvé." }] });
  }

  const validPassword = await bcrypt.compare(password, foundUser.password);
  if (!validPassword) {
    return res.status(400).json({ errors: [{ detail: "Mot de passe invalide." }] });
  }

  // Génération du token JWT avec le rôle
  const token = jwt.sign(
    { id: foundUser.id, email: foundUser.email, role: foundUser.role },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  return res.json({
    token_type: "Bearer",
    expires_in: "24h",
    access_token: token,
    refresh_token: token,
  });
};

// 🚀 Register Handler (Utilisateurs et Administrateurs)
export const registerRouteHandler = async (req, res) => {
  const { FirstName, LastName, email, password, role, profile_image, numero, country, company_name, code_tva } = req.body;

  if (!password || password.length < 8) {
    return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères." });
  }

  let foundUser;
  let newUser;
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  if (["super_admin", "admin_flotte", "admin_client", "admin_support"].includes(role)) {
    foundUser = await adminModel.findOne({ email });
    if (foundUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé par un administrateur." });
    }

    newUser = new adminModel({
      company_name,
      email,
      password: hashPassword,
      role,
      num: numero,
      country,
      code_tva,
    });
  } else {
    foundUser = await userModel.findOne({ email });
    if (foundUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    newUser = new userModel({
      FirstName,
      LastName,
      email,
      password: hashPassword,
      role,
      profile_image,
      numero,
      country,
    });
  }

  await newUser.save();

  const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  return res.status(200).json({
    token_type: "Bearer",
    expires_in: "24h",
    access_token: token,
    refresh_token: token,
  });
};

// 🚀 Forgot Password Handler (Utilisateurs et Administrateurs)
export const forgotPasswordRouteHandler = async (req, res) => {
  const { email } = req.body;
  let foundUser = await userModel.findOne({ email }) || await adminModel.findOne({ email });

  if (!foundUser) {
    return res.status(400).json({ errors: { email: ["Cet email n'existe pas."] } });
  }

  let token = randomToken(20);

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Réinitialisation du mot de passe",
    html: `<p>Pour réinitialiser votre mot de passe, cliquez sur <a href='${process.env.APP_URL_CLIENT}/auth/reset-password?token=${token}&email=${email}'>ce lien</a>.</p>`,
  });

  await passwordResetModel.create({ email: foundUser.email, token, created_at: new Date() });

  return res.status(204).json({ message: "Email envoyé avec succès." });
};

// 🚀 Reset Password Handler
export const resetPasswordRouteHandler = async (req, res) => {
  const { email, token, password, password_confirmation } = req.body;

  let foundToken = await passwordResetModel.findOne({ email, token });

  if (!foundToken) {
    return res.status(400).json({ errors: { email: ["Jeton invalide ou expiré."] } });
  }

  if (password.length < 8) {
    return res.status(400).json({ errors: { password: ["Le mot de passe doit contenir au moins 8 caractères."] } });
  }

  if (password !== password_confirmation) {
    return res.status(400).json({ errors: { password: ["Les mots de passe ne correspondent pas."] } });
  }

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  await userModel.updateOne({ email }, { $set: { password: hashPassword } });
  await adminModel.updateOne({ email }, { $set: { password: hashPassword } }); // Mise à jour aussi pour admin
  await passwordResetModel.deleteOne({ email });

  return res.sendStatus(204);
};
