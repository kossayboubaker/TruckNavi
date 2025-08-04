import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const SignUp = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 - Super Admin
    FirstName: "",
    LastName: "",
    email_user: "",
    password: "",
    num_user: "",
    country: "",

    // Step 2 - Company Info
    company_name: "",
    campany_email: "",
    code_tva: "",
    Campany_adress: "",
    num_campany: "",
    representant_legal: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:8080/admin/admin/register-super-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Registration failed.");

      setSuccess("Registration successful! Redirecting...");
      setTimeout(() => navigate("/signin"), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const transitionVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Super Admin Sign Up</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="border p-4 shadow position-relative" style={{ minHeight: "500px" }}>
          {step === 1 && (
            <motion.div
              key="step1"
              variants={transitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5 }}
            >
              <h4 className="mb-3">Personal Information</h4>
              <div className="mb-3">
                <label className="form-label">First Name</label>
                <input type="text" name="FirstName" className="form-control" value={formData.FirstName} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Last Name</label>
                <input type="text" name="LastName" className="form-control" value={formData.LastName} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" name="email_user" className="form-control" value={formData.email_user} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input type="password" name="password" className="form-control" value={formData.password} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone Number</label>
                <input type="text" name="num_user" className="form-control" value={formData.num_user} onChange={handleChange} />
              </div>
              <div className="mb-3">
                <label className="form-label">Country</label>
                <input type="text" name="country" className="form-control" value={formData.country} onChange={handleChange} />
              </div>
              <button type="button" onClick={handleNext} className="btn btn-primary w-100">
                Next
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={transitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5 }}
            >
              <h4 className="mb-3">Company Information</h4>
              <div className="mb-3">
                <label className="form-label">Company Name</label>
                <input type="text" name="company_name" className="form-control" value={formData.company_name} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Company Email</label>
                <input type="email" name="campany_email" className="form-control" value={formData.campany_email} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">VAT Code</label>
                <input type="text" name="code_tva" className="form-control" value={formData.code_tva} onChange={handleChange} />
              </div>
              <div className="mb-3">
                <label className="form-label">Company Address</label>
                <input type="text" name="Campany_adress" className="form-control" value={formData.Campany_adress} onChange={handleChange} />
              </div>
              <div className="mb-3">
                <label className="form-label">Company Phone</label>
                <input type="text" name="num_campany" className="form-control" value={formData.num_campany} onChange={handleChange} />
              </div>
              <div className="mb-3">
                <label className="form-label">Legal Representative</label>
                <input type="text" name="representant_legal" className="form-control" value={formData.representant_legal} onChange={handleChange} />
              </div>
              <div className="d-flex justify-content-between">
                <button type="button" onClick={handleBack} className="btn btn-secondary">
                  Back
                </button>
                <button type="submit" className="btn btn-success">
                  Submit
                </button>
              </div>
            </motion.div>
          )}
      </form>
    </div>
  );
};

export default SignUp;
