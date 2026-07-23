const SUPABASE_URL = "https://nkdzfxanmvmrhehqtrtl.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rZHpmeGFubXZtcmhlaHF0cnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MjU0NTUsImV4cCI6MjEwMDIwMTQ1NX0.s2p1LJahrZnNw1ICyhAEmRxWnfjVojo-ZvdghI5_9oc";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Registration Successful!");
    console.log(data);
  }
});
