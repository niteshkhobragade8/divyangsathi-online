alert("Step 1 - app.js started");

const supabaseUrl = "https://nkdzfxanmvmrhehqtrtl.supabase.co";

const supabaseKey =
"sb_publishable_0K8Tq7ng_CCm6wVrRBJxGQ_kNYhwaXq";

alert("Step 2 - URL and Key loaded");

const supabase = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);

alert("Step 3 - Supabase connected");

const form = document.getElementById("registerForm");

if (!form) {
  alert("ERROR: registerForm not found");
} else {
  alert("Step 4 - Form found");

  form.addEventListener("submit", async (e) => {

    e.preventDefault();

    alert("Step 5 - Submit clicked");

  });
}
