const supabaseUrl = "https://nkdzfxanmvmrhehqtrtl.supabase.co";

const supabaseKey =
  "sb_publishable_0K8Tq7ng_CCm6wVrRBJxGQ_kNYhwaXq";

const supabase = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);

document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {

    e.preventDefault();

    const full_name =
      document.getElementById("full_name").value;

    const mobile =
      document.getElementById("mobile").value;

    const email =
      document.getElementById("email").value;

    const gender =
      document.getElementById("gender").value;

    const password =
      document.getElementById("password").value;

    const confirmPassword =
      document.getElementById("confirm_password").value;

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .insert([
        {
          full_name,
          mobile,
          email,
          gender
        }
      ]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Registration Successful!");
      document
        .getElementById("registerForm")
        .reset();
    }

});
