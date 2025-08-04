import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const dbConnect = () => {
  mongoose.connection.once("open", () => console.log("DB connection"));
  return mongoose.connect(
     `mongodb+srv://Exypnotech:EMj6oghYfCtAU2nX@cluster1.xipnf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1
`,

    // `mongodb+srv://${process.env.DB_LINK}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
  })

  
  .then(() => console.log('✅ MongoDB Atlas connecté'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB', err));
};
