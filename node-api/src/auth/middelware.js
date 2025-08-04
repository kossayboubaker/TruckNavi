import jwt from 'jsonwebtoken';
import { dbConnect } from '../mongo/index.js';
import { User } from '../model/user.js';

export const authenticate = async (req, res, next) => {
  const token =
    req.cookies.token ||
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);

  if (!token) return res.status(401).json({ message: "Non authentifié" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
const user = await User.findById(decoded._id).populate("company");

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    // ✅ Ajout de tous les champs utiles pour vérifier si profil est incomplet
    req.user = {
      _id: user._id,
      email_user: user.email_user,
      role: user.role,
      FirstName: user.FirstName,
      LastName: user.LastName,
      num_user: user.num_user,
      country: user.country,
      image: user.image,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      company: user.company,
      createdBy:user.createdBy,
    };

    console.log("User authentifié :", req.user);
    next();
  } catch (err) {
    console.error("Erreur d'authentification :", err);
    res.status(403).json({ message: "Token invalide" });
  }
};
