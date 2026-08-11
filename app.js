// ======================================
// A - SUPABASE CONFIG
// ======================================

const SUPABASE_URL = "https://nkdzfxanmvmrhehqtrtl.supabase.co";

const SUPABASE_KEY = "sb_publishable_0K8Tq7ng_CCm6wVrRBJxGQ_kNYhwaXq";

const client = window.__DS_SUPABASE_CLIENT__ || window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
window.__DS_SUPABASE_CLIENT__ = client;

// ======================================
// FINAL SAFE EXTERNAL NOTIFICATION HOOKS
// Secrets stay in Supabase Edge Functions. Failures never block core flows.
// ======================================
async function dsInvokeEdgeFunction(name, body) {
  try {
    if (!client?.functions?.invoke) return null;
    const { data, error } = await client.functions.invoke(name, { body });
    if (error) console.warn(name + " notification skipped:", error.message);
    return data || null;
  } catch (error) {
    console.warn(name + " notification skipped:", error.message);
    return null;
  }
}

async function dsSendEmail(to, subject, html) {
  if (!to) return;
  return dsInvokeEdgeFunction("send-email", { to, subject, html });
}

async function dsSendPaymentWhatsApp(payload) {
  return dsInvokeEdgeFunction("send-whatsapp", payload);
}

// ======================================
// A - REGISTER
// ======================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

  registerForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const full_name = document.getElementById("full_name").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const email = document.getElementById("email").value.trim();
    const gender = document.getElementById("gender").value;
    const password = document.getElementById("password").value;
    const confirm_password = document.getElementById("confirm_password").value;

    if (password !== confirm_password) {
      alert("Passwords do not match");
      return;
    }

    const { data, error } = await client.auth.signUp({
      email,
      password
    });

    if (error) {
      alert(error.message);
      return;
    }

    const { error: profileError } = await client
      .from("profiles")
      .insert([
        {
          id: data.user.id,
          full_name: full_name,
          mobile: mobile,
          email: email,
          gender: gender
        }
      ]);

    if (profileError) {
      alert(profileError.message);
      return;
    }

    await dsSendEmail(
      email,
      "Welcome to DivyangSathi",
      `<h2>Welcome ${full_name}</h2><p>Your DivyangSathi registration was successful. Complete your profile to receive better match recommendations.</p>`
    );

    alert("Registration Successful!");

    registerForm.reset();

  });

}

// ======================================
// B - LOGIN
// ======================================

const loginForm =
  document.getElementById("loginForm");

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      const email =
        document
          .getElementById("loginEmail")
          .value
          .trim();

      const password =
        document
          .getElementById("loginPassword")
          .value;

      const {
        data,
        error
      } = await client.auth
        .signInWithPassword({
          email,
          password
        });

      if (error) {

        alert(error.message);

        return;

      }

      const user = data.user;


      // Admin check

      const {
        data: admin,
        error: adminError
      } = await client
        .from("admins")
        .select("id, active")
        .eq("id", user.id)
        .maybeSingle();

      if (adminError) {

        console.error(
          "Admin check error:",
          adminError.message
        );

      }


      if (
        admin &&
        admin.active === true
      ) {

        alert("Welcome Admin!");

        window.location.href =
          "admin.html";

        return;

      }


      // Blocked user check

      const {
        data: profile,
        error: profileError
      } = await client
        .from("profiles")
        .select("id, blocked")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {

        await client.auth.signOut({ scope: "local" });

        alert(
          "Profile check failed: " +
          profileError.message
        );

        return;

      }

      if (!profile) {

        await client.auth.signOut({ scope: "local" });

        alert(
          "Aapka profile record nahi mila."
        );

        return;

      }

      if (profile.blocked === true) {

        await client.auth.signOut({ scope: "local" });

        alert(
          "Your account has been blocked by admin."
        );

        return;

      }


      // Mark user online

      const {
        error: onlineError
      } = await client
        .from("profiles")
        .update({
          is_online: true,
          last_seen:
            new Date().toISOString()
        })
        .eq("id", user.id);

      if (onlineError) {

        console.error(
          "Online status update error:",
          onlineError.message
        );

      }


      alert("Login Successful!");

      window.location.href =
        "profile.html";

    }
  );

}


// ======================================
// B - SESSION CHECK
// ======================================

async function checkSession() {

  const {
    data: { session },
    error
  } = await client.auth.getSession();

  if (error) {

    console.error(
      "Session check error:",
      error.message
    );

    return;

  }

  if (!session?.user) {

    console.log(
      "User Not Logged In"
    );

    return;

  }

  console.log(
    "User Logged In"
  );


  // Admin profile table me nahi hota,
  // isliye sirf profiles record milne par update hoga.

  const {
    data: profile
  } = await client
    .from("profiles")
    .select("id, blocked")
    .eq(
      "id",
      session.user.id
    )
    .maybeSingle();

  if (!profile) {
    return;
  }

  if (profile.blocked === true) {

    await client.auth.signOut({ scope: "local" });

    alert(
      "Your account has been blocked by admin."
    );

    window.location.href =
      "login.html";

    return;

  }

  const {
    error: onlineError
  } = await client
    .from("profiles")
    .update({
      is_online: true,
      last_seen:
        new Date().toISOString()
    })
    .eq(
      "id",
      session.user.id
    );

  if (onlineError) {

    console.error(
      "Session online update error:",
      onlineError.message
    );

  }

}

checkSession();


// ======================================
// B - LOGOUT
// ======================================

async function logoutCurrentUser() {

  const {
    data: { user }
  } = await client.auth.getUser();

  if (user) {

    const {
      error: offlineError
    } = await client
      .from("profiles")
      .update({
        is_online: false,
        last_seen:
          new Date().toISOString()
      })
      .eq("id", user.id);

    if (offlineError) {

      console.error(
        "Offline status update error:",
        offlineError.message
      );

    }

  }

  const {
    error: signOutError
  } = await client.auth.signOut({ scope: "local" });

  if (signOutError) {

    alert(signOutError.message);

    return;

  }

  alert("Logout Successful");

  window.location.href =
    "login.html";

}


const logoutBtn =
  document.getElementById("logoutBtn");

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    logoutCurrentUser
  );

}


const headerLogoutBtn =
  document.getElementById(
    "headerLogoutBtn"
  );

if (headerLogoutBtn) {

  headerLogoutBtn.addEventListener(
    "click",
    logoutCurrentUser
  );

}

// ======================================
// B - FORGOT PASSWORD
// ======================================

async function resetPassword(email) {

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/login.html"
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Password reset link sent to your email.");

}
// ======================================
// C - PAGE PROTECTION
// ======================================
async function protectPage() {

  const {
    data: { session }
  } = await client.auth.getSession();

  const page = window.location.pathname;

  if (
    !session &&
    (
      page.includes("profile.html") ||
      page.includes("notifications.html") ||
      page.includes("chat.html") ||
      page.includes("view-profile.html")
    )
  ) {
    window.location.href = "login.html";
    return;
  }

}

protectPage();

// ======================================
// C - LOAD PROFILE
// ======================================

async function loadProfile() {

  const {
    data: { user }
  } = await client.auth.getUser();

  if (!user) return;

  const gender =
document.getElementById("searchGender")?.value;

const age =
document.getElementById("searchAge")?.value;

const state =
document.getElementById("searchState")?.value.trim();

const disability =
document.getElementById("searchDisability")?.value;

let query =
client
.from("profiles")
.select("*");

if(gender){

query =
query.eq("gender",gender);

}

if(state){

query =
query.ilike("state","%"+state+"%");

}

if(disability){

query =
query.eq(
"disability_type",
disability
);

}

const {
  data,
  error
} = await client
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .maybeSingle();

if (error) {
  console.log("Profile load error:", error.message);
  return;
}

if (!data) {
  console.log("Profile record not found");
  return;
}

if (document.getElementById("profileName")) {
  document.getElementById("profileName").value =
    data.full_name || "";
}

if (document.getElementById("profileMobile")) {
  document.getElementById("profileMobile").value =
    data.mobile || "";
}

  if (document.getElementById("profileEmail"))
    document.getElementById("profileEmail").value = data.email || "";

  if (document.getElementById("profileGender"))
    document.getElementById("profileGender").value = data.gender || "";

  if (document.getElementById("dateOfBirth"))
    document.getElementById("dateOfBirth").value = data.date_of_birth || "";

  if (document.getElementById("age"))
    document.getElementById("age").value = data.age || "";

  if (document.getElementById("disabilityType"))
    document.getElementById("disabilityType").value = data.disability_type || "";

  if (document.getElementById("disabilityPercentage"))
    document.getElementById("disabilityPercentage").value = data.disability_percentage || "";

  if (document.getElementById("religion"))
    document.getElementById("religion").value = data.religion || "";

  if (document.getElementById("caste"))
    document.getElementById("caste").value = data.caste || "";

  if (document.getElementById("maritalStatus"))
    document.getElementById("maritalStatus").value = data.marital_status || "";

  if (document.getElementById("height"))
    document.getElementById("height").value = data.height || "";

  if (document.getElementById("weight"))
    document.getElementById("weight").value = data.weight || "";

  if (document.getElementById("education"))
    document.getElementById("education").value = data.education || "";

  if (document.getElementById("occupation"))
    document.getElementById("occupation").value = data.occupation || "";

  if (document.getElementById("income"))
    document.getElementById("income").value = data.income || "";

  if (document.getElementById("state"))
    document.getElementById("state").value = data.state || "";

  if (document.getElementById("district"))
    document.getElementById("district").value = data.district || "";

  if (document.getElementById("city"))
    document.getElementById("city").value = data.city || "";

  if (document.getElementById("aboutMe"))
    document.getElementById("aboutMe").value = data.about_me || "";

  if (document.getElementById("preferredAge"))
    document.getElementById("preferredAge").value = data.preferred_age || "";

  if (document.getElementById("preferredState"))
    document.getElementById("preferredState").value = data.preferred_state || "";

  if (document.getElementById("preferredDisability"))
    document.getElementById("preferredDisability").value = data.preferred_disability || "";

  if (document.getElementById("partnerPreference"))
    document.getElementById("partnerPreference").value = data.partner_preference || "";

  // ======================================
  // USER PROFILE STATUS / VERIFICATION SYNC
  // ======================================

  const verificationStatus =
    document.getElementById("dashboardVerificationStatus");

  if (verificationStatus) {
    verificationStatus.textContent =
      data.verified === true
        ? "Verified"
        : "Pending";
  }

  const aadhaarFrontPreview =
    document.getElementById("aadhaarFrontPreview");

  const aadhaarBackPreview =
    document.getElementById("aadhaarBackPreview");

  const aadhaarStatus =
    document.getElementById("aadhaarStatus");

  if (aadhaarFrontPreview) {
    if (data.aadhaar_front_url) {
      aadhaarFrontPreview.src = data.aadhaar_front_url;
      aadhaarFrontPreview.style.display = "block";
    } else {
      aadhaarFrontPreview.removeAttribute("src");
      aadhaarFrontPreview.style.display = "none";
    }
  }

  if (aadhaarBackPreview) {
    if (data.aadhaar_back_url) {
      aadhaarBackPreview.src = data.aadhaar_back_url;
      aadhaarBackPreview.style.display = "block";
    } else {
      aadhaarBackPreview.removeAttribute("src");
      aadhaarBackPreview.style.display = "none";
    }
  }

  if (aadhaarStatus) {
    const hasAadhaar =
      !!data.aadhaar_front_url ||
      !!data.aadhaar_back_url;

    const status =
      String(data.aadhaar_status || "").toLowerCase();

    if (status === "approved") {
      aadhaarStatus.textContent = "Approved";
    } else if (status === "rejected") {
      aadhaarStatus.textContent = "Rejected";
    } else if (status === "pending" || hasAadhaar) {
      aadhaarStatus.textContent = "Pending Verification";
    } else {
      aadhaarStatus.textContent = "Not Uploaded";
    }
  }

  const facePreview =
    document.getElementById("faceVerificationPreview");

  const faceStatus =
    document.getElementById("faceVerificationStatus");

  if (facePreview) {
    if (data.face_photo_url) {
      facePreview.src = data.face_photo_url;
      facePreview.style.display = "block";
    } else {
      facePreview.removeAttribute("src");
      facePreview.style.display = "none";
    }
  }

  if (faceStatus) {
    const status =
      String(data.face_verification_status || "").toLowerCase();

    if (status === "approved") {
      faceStatus.textContent = "Approved";
    } else if (status === "rejected") {
      faceStatus.textContent = "Rejected";
    } else if (status === "pending" || data.face_photo_url) {
      faceStatus.textContent = "Pending Verification";
    } else {
      faceStatus.textContent = "Not Uploaded";
    }
  }

  // Tell profile.html that database values are now present.
  document.dispatchEvent(
    new CustomEvent("divyangsathi:profile-loaded", {
      detail: { profile: data }
    })
  );

}

async function loadPremiumBadge() {

    const { data: { user } } = await client.auth.getUser();

    if (!user) return;

    const { data, error } = await client
        .from("profiles")
        .select("premium,membership_expiry")
        .eq("id", user.id)
        .maybeSingle();

    if (error) return;

    const badge = document.getElementById("premiumBadge");

    const expiry = document.getElementById("premiumExpiry");

    if (!badge) return;
if (!data) {
  console.log("Premium profile record not found");
  return;
}
    if (data.premium === true) {

        badge.style.display = "block";

        expiry.innerHTML =
            "Valid Till : " + data.membership_expiry;

    } else {

        badge.style.display = "none";

    }

}

loadProfile();
loadPremiumBadge();

// ======================================
// PROFILE FORM UPDATE
// ======================================

const profileForm = document.getElementById("profileForm");

if (profileForm) {

  profileForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const submitButton = profileForm.querySelector('button[type="submit"]');

    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();

    if (userError || !user) {
      alert("Please login first.");
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerText = "Saving Profile...";
    }

    const updateData = {

      full_name:
        document.getElementById("profileName").value.trim(),

      mobile:
        document.getElementById("profileMobile").value.trim(),

      gender:
        document.getElementById("profileGender").value,

      date_of_birth:
        document.getElementById("dateOfBirth").value || null,

      age:
        document.getElementById("age").value || null,

      disability_type:
        document.getElementById("disabilityType").value.trim(),

      disability_percentage:
        document.getElementById("disabilityPercentage").value || null,

      religion:
        document.getElementById("religion").value.trim(),

      caste:
        document.getElementById("caste").value.trim(),

      marital_status:
        document.getElementById("maritalStatus").value,

      height:
        document.getElementById("height").value || null,

      weight:
        document.getElementById("weight").value || null,

      education:
        document.getElementById("education").value.trim(),

      occupation:
        document.getElementById("occupation").value.trim(),

      income:
        document.getElementById("income").value || null,

      state:
        document.getElementById("state").value.trim(),

      district:
        document.getElementById("district").value.trim(),

      city:
        document.getElementById("city").value.trim(),

      about_me:
        document.getElementById("aboutMe").value.trim(),

      preferred_age:
        document.getElementById("preferredAge").value.trim(),

      preferred_state:
        document.getElementById("preferredState").value.trim(),

      preferred_disability:
        document.getElementById("preferredDisability").value.trim(),

      partner_preference:
        document.getElementById("partnerPreference").value.trim()

    };

    const { error } = await client
  .from("profiles")
  .upsert({
    id: user.id,
    email: user.email,
    ...updateData
  });

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerText = "Save Profile";
    }

    if (error) {
      alert("Profile update failed: " + error.message);
      return;
    }

    // ======================================
// AADHAAR STATUS
// ======================================

const aadhaarFrontFile =
document.getElementById("aadhaarFront")?.files[0];

const aadhaarBackFile =
document.getElementById("aadhaarBack")?.files[0];

let aadhaarFrontUrl = null;
let aadhaarBackUrl = null;

// Keep already saved Aadhaar side when user replaces only one image.
try {
  const { data: oldAadhaar } = await client
    .from("profiles")
    .select("aadhaar_front_url,aadhaar_back_url")
    .eq("id", user.id)
    .maybeSingle();

  aadhaarFrontUrl = oldAadhaar?.aadhaar_front_url || null;
  aadhaarBackUrl = oldAadhaar?.aadhaar_back_url || null;
} catch (_) {}

if (aadhaarFrontFile) {

const frontPath =
`${user.id}/front_${Date.now()}`;

const { error: frontError } =
await client.storage
.from("aadhaar")
.upload(
frontPath,
aadhaarFrontFile,
{
upsert:true
}
);

if(!frontError){

const { data } =
client.storage
.from("aadhaar")
.getPublicUrl(frontPath);

aadhaarFrontUrl =
data.publicUrl;

}

}

if (aadhaarBackFile) {

const backPath =
`${user.id}/back_${Date.now()}`;

const { error: backError } =
await client.storage
.from("aadhaar")
.upload(
backPath,
aadhaarBackFile,
{
upsert:true
}
);

if(!backError){

const { data } =
client.storage
.from("aadhaar")
.getPublicUrl(backPath);

aadhaarBackUrl =
data.publicUrl;

}

}

if(
aadhaarFrontUrl ||
aadhaarBackUrl
){

await client
.from("profiles")
.update({

aadhaar_front_url:
aadhaarFrontUrl,

aadhaar_back_url:
aadhaarBackUrl,

aadhaar_status:
"pending"

})
.eq(
"id",
user.id
);

}

// ======================================
// FACE VERIFICATION UPLOAD
// ======================================

const faceFile =
  document.getElementById(
    "faceVerificationPhoto"
  )?.files[0];

if (faceFile) {

  const extension =
    faceFile.name
      .split(".")
      .pop();

  const facePath =
    `${user.id}/selfie.${extension}`;

  const {
    error: faceUploadError
  } = await client.storage
    .from("face-verification")
    .upload(
      facePath,
      faceFile,
      {
        upsert: true
      }
    );

  if (faceUploadError) {

    alert(
      "Face photo upload nahi hui: " +
      faceUploadError.message
    );

    return;

  }

  const {
    data: faceUrlData
  } = client.storage
    .from("face-verification")
    .getPublicUrl(
      facePath
    );

  const {
    error: faceSaveError
  } = await client
    .from("profiles")
    .update({
      face_photo_url:
        faceUrlData.publicUrl,

      face_verification_status:
        "pending"
    })
    .eq(
      "id",
      user.id
    );

  if (faceSaveError) {

    alert(
      "Face verification save nahi hui: " +
      faceSaveError.message
    );

    return;

  }

}
    await loadProfile();

    alert("Profile Updated Successfully! ✅");

  });


}


// ======================================
// PROFILE PHOTO PREVIEW AND UPLOAD
// ======================================

const photoInput = document.getElementById("profilePhoto");

if (photoInput) {

  photoInput.addEventListener("change", async function () {

    const file = this.files[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG, PNG or WEBP image is allowed.");
      photoInput.value = "";
      return;
    }

    const maximumFileSize = 5 * 1024 * 1024;

    if (file.size > maximumFileSize) {
      alert("Profile photo size must be less than 5 MB.");
      photoInput.value = "";
      return;
    }

    const preview = document.getElementById("photoPreview");

    if (preview) {
      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
    }

    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();

    if (userError || !user) {
      alert("Please login first.");
      return;
    }

    const fileExtension =
      file.name.split(".").pop().toLowerCase();

    const filePath =
      `${user.id}/profile_${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await client.storage
      .from("profile-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true
      });

    if (uploadError) {
      alert("Photo upload failed: " + uploadError.message);
      return;
    }

    const { data: publicData } = client.storage
      .from("profile-images")
      .getPublicUrl(filePath);

    const imageUrl = publicData.publicUrl;

    const { error: databaseError } = await client
      .from("profiles")
      .update({
        profile_photo: imageUrl
      })
      .eq("id", user.id);

    if (databaseError) {
      alert(
        "Photo uploaded but database update failed: " +
        databaseError.message
      );
      return;
    }

    if (preview) {
      preview.src = imageUrl;
      preview.style.display = "block";
    }

    alert("Profile Photo Uploaded Successfully! ✅");

  });

}


// ======================================
// LOAD EXISTING PROFILE PHOTO
// ======================================

async function loadProfilePhoto() {

  const preview = document.getElementById("photoPreview");

  if (!preview) return;

  const {
    data: { user },
    error: userError
  } = await client.auth.getUser();

  if (userError || !user) return;

  const { data, error } = await client
    .from("profiles")
    .select("profile_photo")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.log("Profile photo load error:", error.message);
    return;
  }

  if (data && data.profile_photo) {
    preview.src = data.profile_photo;
    preview.style.display = "block";
  }

}

loadProfilePhoto();

// ======================================
// E - LOAD PHOTO
// ======================================

async function loadProfilePhoto() {

  const {
    data: { user }
  } = await client.auth.getUser();

  if (!user) return;

  const { data } = await client
    .from("profiles")
    .select("profile_photo")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) return;

  const preview = document.getElementById("photoPreview");

  if (preview && data.profile_photo) {

    preview.src = data.profile_photo;
    preview.style.display = "block";

  }

}

loadProfilePhoto();

// ======================================
// F - SEARCH PROFILES
// ONLINE / OFFLINE + LAST SEEN
// ======================================

const searchForm =
  document.querySelector(".search-form");

if (searchForm) {

  loadProfiles();

  searchForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      await loadProfiles();

    }
  );

}


async function loadProfiles() {

  const results =
    document.querySelector(".search-results");

  if (!results) return;

  results.innerHTML = `
    <div class="feature-box">
      <h3>Loading Profiles...</h3>
    </div>
  `;


  const {
    data: { user },
    error: userError
  } = await client.auth.getUser();

  if (userError) {

    console.error(
      "Search user error:",
      userError.message
    );

  }


  const {
    data: profiles,
    error
  } = await client
    .from("profiles")
    .select(`
      id,
      full_name,
      profile_photo,
      age,
      gender,
      state,
      district,
      disability_type,
      education,
      occupation,
      premium,
      membership_plan,
      verified,
      blocked,
      is_online,
      last_seen
    `)
    .eq("blocked", false)
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {

    results.innerHTML = `
      <div class="feature-box">
        <h3>Profiles load nahi hui</h3>
        <p>${escapeSearchText(error.message)}</p>
      </div>
    `;

    return;

  }


  const availableProfiles =
    (profiles || []).filter(profile => {

      if (
        user &&
        profile.id === user.id
      ) {
        return false;
      }

      return profile.blocked !== true;

    });


  results.innerHTML =
    "<h2>Profile Results</h2>";


  if (availableProfiles.length === 0) {

    results.innerHTML += `
      <div class="feature-box">
        <h3>No Profiles Found</h3>
      </div>
    `;

    return;

  }


  availableProfiles.forEach(profile => {

    const safeName =
      escapeSearchText(
        profile.full_name ||
        "DivyangSathi Member"
      );

    const safeState =
      escapeSearchText(
        profile.state || "-"
      );

    const safeDistrict =
      escapeSearchText(
        profile.district || "-"
      );

    const safeDisability =
      escapeSearchText(
        profile.disability_type || "-"
      );

    const firstLetter =
      safeName
        .charAt(0)
        .toUpperCase();

    const photoHtml =
      profile.profile_photo
        ? `
          <img
            src="${profile.profile_photo}"
            alt="Profile Photo"
            class="search-profile-photo">
        `
        : `
          <div class="search-profile-placeholder">
            ${firstLetter}
          </div>
        `;


    const membershipPlan =
      profile.membership_plan ||
      (
        profile.premium === true
          ? "Premium"
          : "Free"
      );


    const membershipBadge =
      membershipPlan !== "Free"
        ? `
          <span class="search-membership-badge">
            👑 ${escapeSearchText(
              membershipPlan
            )}
          </span>
        `
        : `
          <span class="search-free-badge">
            🆓 Free
          </span>
        `;


    const verifiedBadge =
      profile.verified === true
        ? `
          <span class="search-verified-badge">
            ✅ Verified
          </span>
        `
        : `
          <span class="search-pending-badge">
            ⏳ Pending
          </span>
        `;


    const onlineHtml =
      profile.is_online === true
        ? `
          <div class="search-online-row">
            <span class="search-online-badge online">
              🟢 Online
            </span>

            <span class="search-last-seen">
              Active now
            </span>
          </div>
        `
        : `
          <div class="search-online-row">
            <span class="search-online-badge offline">
              ⚫ Offline
            </span>

            <span class="search-last-seen">
              ${formatSearchLastSeen(
                profile.last_seen
              )}
            </span>
          </div>
        `;


    results.innerHTML += `

      <article
        class="search-profile-card
        ${profile.premium === true
          ? "search-profile-premium"
          : ""}">

        <div class="search-profile-photo-area">

          ${photoHtml}

          ${profile.is_online === true
            ? `
              <span class="search-photo-online-dot">
              </span>
            `
            : ""}

        </div>


        <div class="search-profile-content">

          <h3>
            ${safeName}
          </h3>


          <div class="search-profile-badges">

            ${membershipBadge}

            ${verifiedBadge}

          </div>


          ${onlineHtml}


          <div class="search-profile-info-grid">

            <p>
              <strong>🎂 Age</strong><br>
              ${profile.age || "-"}
            </p>

            <p>
              <strong>⚧ Gender</strong><br>
              ${escapeSearchText(
                profile.gender || "-"
              )}
            </p>

            <p>
              <strong>📍 State</strong><br>
              ${safeState}
            </p>

            <p>
              <strong>🏙 District</strong><br>
              ${safeDistrict}
            </p>

            <p>
              <strong>♿ Disability</strong><br>
              ${safeDisability}
            </p>

            <p>
              <strong>🎓 Education</strong><br>
              ${escapeSearchText(
                profile.education || "-"
              )}
            </p>

          </div>


          <div class="search-profile-actions">

            <a
              href="view-profile.html?id=${encodeURIComponent(
                profile.id
              )}"
              class="search-view-button">

              👤 View Profile

            </a>


            <a
              href="chat.html?id=${encodeURIComponent(
                profile.id
              )}"
              class="search-chat-button">

              💬 Chat

            </a>


            <button
              type="button"
              class="search-interest-button"
              onclick="sendInterest('${profile.id}')">

              ❤️ Send Interest

            </button>

          </div>

        </div>

      </article>

    `;

  });

}


// ======================================
// SAFE SEARCH TEXT
// ======================================

function escapeSearchText(value) {

  const element =
    document.createElement("div");

  element.textContent =
    value || "";

  return element.innerHTML;

}


// ======================================
// SEARCH LAST SEEN
// ======================================

function formatSearchLastSeen(dateValue) {

  if (!dateValue) {
    return "Last seen unavailable";
  }

  const lastSeenDate =
    new Date(dateValue);

  const now =
    new Date();

  const seconds =
    Math.floor(
      (
        now.getTime() -
        lastSeenDate.getTime()
      ) / 1000
    );

  if (seconds < 60) {
    return "Last seen just now";
  }

  const minutes =
    Math.floor(seconds / 60);

  if (minutes < 60) {

    return (
      "Last seen " +
      minutes +
      (
        minutes === 1
          ? " minute ago"
          : " minutes ago"
      )
    );

  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {

    return (
      "Last seen " +
      hours +
      (
        hours === 1
          ? " hour ago"
          : " hours ago"
      )
    );

  }

  const days =
    Math.floor(hours / 24);

  if (days === 1) {
    return "Last seen yesterday";
  }

  if (days < 7) {
    return "Last seen " + days + " days ago";
  }

  return (
    "Last seen " +
    lastSeenDate.toLocaleString("en-IN")
  );

}

// ======================================
// F - APP READY
// ======================================

console.log("DivyangSathi Final App Loaded Successfully");
// ======================================
// GALLERY UPLOAD
// ======================================

const galleryInput = document.getElementById("galleryPhoto");

if (galleryInput) {

  galleryInput.addEventListener("change", async function () {

    const files = this.files;

    if (!files.length) return;

    const {
      data: { user }
    } = await client.auth.getUser();

    if (!user) {
      alert("Please login first.");
      return;
    }

    const preview = document.getElementById("galleryPreview");

    preview.innerHTML = "";

    for (let file of files) {

      const filePath =
        user.id + "/gallery/" + Date.now() + "_" + file.name;

      const { error } = await client.storage
        .from("profile-images")
        .upload(filePath, file, {
          upsert: true
        });

      if (error) {
        alert(error.message);
        continue;
      }

      const { data } = client.storage
        .from("profile-images")
        .getPublicUrl(filePath);

      preview.innerHTML += `
        <img src="${data.publicUrl}"
        style="width:120px;height:120px;
        object-fit:cover;
        margin:8px;
        border-radius:10px;">
      `;
    }

    alert("Gallery Uploaded Successfully!");

  });

}

// ======================================
// SEND INTEREST - DUPLICATE PROTECTION
// ======================================

async function sendInterest(receiverId) {

  const {
    data: { user },
    error: userError
  } = await client.auth.getUser();

  if (userError || !user) {
    alert("Please login first.");
    return;
  }

  if (!receiverId) {
    alert("Receiver ID nahi mili.");
    return;
  }

  if (user.id === receiverId) {
    alert("You cannot send interest to yourself.");
    return;
  }


  // Check existing interest

  const {
    data: existingInterest,
    error: existingError
  } = await client
    .from("interests")
    .select("id, status")
    .eq("sender_id", user.id)
    .eq("receiver_id", receiverId)
    .maybeSingle();

  if (existingError) {
    alert(
      "Interest status check nahi hua: " +
      existingError.message
    );
    return;
  }

  if (existingInterest) {

    if (existingInterest.status === "pending") {
      alert("Interest already sent. Status: Pending.");
      return;
    }

    if (existingInterest.status === "accepted") {
      alert("You are already connected with this user.");
      return;
    }

    if (existingInterest.status === "rejected") {
      alert("Your previous interest was rejected.");
      return;
    }

    if (existingInterest.status === "cancelled") {
      alert("Your previous interest was cancelled.");
      return;
    }

    alert("Interest already exists.");
    return;
  }


  // Insert new interest

  const {
    data: newInterest,
    error: insertError
  } = await client
    .from("interests")
    .insert([
      {
        sender_id: user.id,
        receiver_id: receiverId,
        status: "pending"
      }
    ])
    .select("id")
    .maybeSingle();

  if (insertError) {
    alert(
      "Interest send nahi hua: " +
      insertError.message
    );
    return;
  }

  if (!newInterest) {
    alert("Interest record create nahi hua.");
    return;
  }


  // Send notification

  const { error: notificationError } =
    await client
      .from("notifications")
      .insert([
        {
          user_id: receiverId,
          title: "New Interest",
          message: "Someone has sent you an interest."
        }
      ]);

  if (notificationError) {
    console.error(
      "Notification error:",
      notificationError.message
    );
  }

  try {
    const { data: receiverProfile } = await client
      .from("profiles")
      .select("email, full_name")
      .eq("id", receiverId)
      .maybeSingle();

    await dsSendEmail(
      receiverProfile?.email,
      "New Interest on DivyangSathi",
      `<p>Hello ${receiverProfile?.full_name || "Member"},</p><p>You received a new matrimonial interest. Login to DivyangSathi to review it safely.</p>`
    );
  } catch (error) {
    console.warn("Interest email skipped:", error.message);
  }

  alert("❤️ Interest Sent Successfully!");

}

// ======================================
// RECEIVED INTERESTS - PART 1
// ======================================

async function loadReceivedInterests() {

  const container =
    document.getElementById("receivedInterests");

  if (!container) return;

  container.innerHTML = `
    <div class="admin-loading-card">
      <div class="admin-loader"></div>
      <p>Loading Received Interests...</p>
    </div>
  `;

  const {
    data: { user },
    error: userError
  } = await client.auth.getUser();

  if (userError || !user) {

    container.innerHTML = `
      <div class="received-interest-card">
        <h3>Please Login</h3>
        <p>Received interests dekhne ke liye login karein.</p>
      </div>
    `;

    return;
  }

  const {
    data: interests,
    error: interestError
  } = await client
    .from("interests")
    .select(`
      id,
      sender_id,
      receiver_id,
      status,
      created_at
    `)
    .eq("receiver_id", user.id)
    .order("created_at", {
      ascending: false
    });

  if (interestError) {

    container.innerHTML = `
      <div class="received-interest-card">
        <h3>Interests load nahi hue</h3>
        <p>${interestError.message}</p>
      </div>
    `;

    return;
  }

  if (!interests || interests.length === 0) {

    container.innerHTML = `
      <div class="received-interest-card">
        <div style="text-align:center;font-size:55px;">
          ❤️
        </div>

        <h3>No Interests Received</h3>

        <p style="text-align:center;">
          Abhi kisi user ne aapko interest nahi bheja.
        </p>
      </div>
    `;

    return;
  }

  const senderIds = [
    ...new Set(
      interests
        .map(item => item.sender_id)
        .filter(Boolean)
    )
  ];

  const {
    data: senderProfiles,
    error: profileError
  } = await client
    .from("profiles")
    .select(`
      id,
      full_name,
      profile_photo,
      age,
      gender,
      disability_type,
      state,
      district,
      verified,
      membership_plan,
      blocked
    `)
    .in("id", senderIds);

  if (profileError) {

    container.innerHTML = `
      <div class="received-interest-card">
        <h3>Sender profiles load nahi hui</h3>
        <p>${profileError.message}</p>
      </div>
    `;

    return;
  }

  const senderMap = {};

  (senderProfiles || []).forEach(profile => {
    senderMap[profile.id] = profile;
  });

  container.innerHTML = "";

  interests.forEach(item => {

    const sender =
      senderMap[item.sender_id];

    const status =
      item.status || "pending";

    const badgeColor =
      status === "accepted"
        ? "#16a34a"
        : status === "rejected"
        ? "#dc2626"
        : "#f59e0b";

    const badgeText =
      status.charAt(0).toUpperCase() +
      status.slice(1);

    const verifiedBadge =
      sender?.verified
        ? `<span style="
            background:#16a34a;
            color:white;
            padding:4px 10px;
            border-radius:20px;
            font-size:12px;
            margin-left:8px;">
            ✔ Verified
          </span>`
        : "";

    const membershipBadge =
      sender?.membership_plan &&
      sender.membership_plan !== "Free"
        ? `<span style="
            background:#facc15;
            color:#422006;
            padding:4px 10px;
            border-radius:20px;
            font-size:12px;
            margin-left:8px;">
            👑 ${sender.membership_plan}
          </span>`
        : "";

    const photo =
      sender?.profile_photo
        ? sender.profile_photo
        : "https://placehold.co/140x140?text=User";

    container.innerHTML += `

<div class="received-interest-card">

<img
src="${photo}"
alt="Profile Photo">

<h3>

${sender?.full_name || "Unknown User"}

${verifiedBadge}

${membershipBadge}

</h3>

<p>
<b>🎂 Age:</b>
${sender?.age || "-"}
</p>

<p>
<b>⚧ Gender:</b>
${sender?.gender || "-"}
</p>

<p>
<b>♿ Disability:</b>
${sender?.disability_type || "-"}
</p>

<p>
<b>📍 State:</b>
${sender?.state || "-"}
</p>

<p>
<b>🏙 District:</b>
${sender?.district || "-"}
</p>

<p>

<b>Status:</b>

<span style="
background:${badgeColor};
color:white;
padding:5px 12px;
border-radius:20px;
font-size:12px;">

${badgeText}

</span>

</p>

<div class="received-action-buttons">

<a
class="received-view"
href="view-profile.html?id=${sender?.id}">
👀 View Profile
</a>

${
  status === "pending"
  ?

`
<button
class="received-accept"
onclick="acceptInterest('${item.id}')">

✅ Accept

</button>

<button
class="received-reject"
onclick="rejectInterest('${item.id}')">

❌ Reject

</button>
`

:

status === "accepted"

?

`
<a
class="received-chat"
href="chat.html?id=${sender?.id}">

💬 Chat

</a>
`

:

`
<button
disabled
style="
flex:1;
padding:12px;
border:none;
border-radius:10px;
background:#9ca3af;
color:white;
cursor:not-allowed;">

Rejected

</button>
`

}

</div>

</div>

`;

  });

}

loadReceivedInterests();


// ======================================
// ACCEPT INTEREST
// ======================================

async function acceptInterest(id){

  const { error } =
    await client
      .from("interests")
      .update({
        status:"accepted"
      })
      .eq("id",id);

  if(error){

    alert(error.message);

    return;

  }

  alert(
    "Interest Accepted Successfully ❤️"
  );

  loadReceivedInterests();

}


// ======================================
// REJECT INTEREST
// ======================================

async function rejectInterest(id){

  const { error } =
    await client
      .from("interests")
      .update({
        status:"rejected"
      })
      .eq("id",id);

  if(error){

    alert(error.message);

    return;

  }

  alert(
    "Interest Rejected"
  );

  loadReceivedInterests();

}

// ======================================
// VIEW PROFILE
// ======================================

async function loadViewProfile() {

  if (
    !window.location.pathname.includes(
      "view-profile.html"
    )
  ) {
    return;
  }

  const params =
    new URLSearchParams(
      window.location.search
    );

  const profileId =
    params.get("id");

  if (!profileId) {

    alert("Profile ID nahi mili.");

    window.location.href =
      "search.html";

    return;

  }


  // ======================================
  // LOGIN USER CHECK
  // ======================================

  const {
    data: { user },
    error: userError
  } = await client.auth.getUser();

  if (userError || !user) {

    alert("Please login first.");

    window.location.href =
      "login.html";

    return;

  }


  if (user.id === profileId) {

    alert(
      "Apni profile dekhne ke liye My Profile page kholen."
    );

    window.location.href =
      "profile.html";

    return;

  }


  // ======================================
  // MEMBERSHIP LIMIT + VIEW COUNTER
  // ======================================

  const {
    data: accessResult,
    error: accessError
  } = await client.rpc(
    "open_profile",
    {
      target_profile_id: profileId
    }
  );

  if (accessError) {

    console.error(
      "Profile access error:",
      accessError.message
    );

    alert(
      "Profile open nahi hui: " +
      accessError.message
    );

    return;

  }

  if (
    !accessResult ||
    accessResult.allowed !== true
  ) {

    alert(
      accessResult?.message ||
      "Profile view access nahi mila."
    );

    window.location.href =
      "membership.html";

    return;

  }


  // ======================================
  // RECORD PROFILE VIEW - ONCE PER DAY
  // ======================================

  const todayStart =
    new Date();

  todayStart.setHours(
    0,
    0,
    0,
    0
  );

  const tomorrowStart =
    new Date(todayStart);

  tomorrowStart.setDate(
    tomorrowStart.getDate() + 1
  );


  const {
    data: existingViews,
    error: viewCheckError
  } = await client
    .from("profile_views")
    .select("id")
    .eq(
      "viewer_id",
      user.id
    )
    .eq(
      "viewed_profile_id",
      profileId
    )
    .gte(
      "viewed_at",
      todayStart.toISOString()
    )
    .lt(
      "viewed_at",
      tomorrowStart.toISOString()
    )
    .limit(1);


  if (viewCheckError) {

    console.error(
      "Profile view check error:",
      viewCheckError.message
    );

  } else if (
    !existingViews ||
    existingViews.length === 0
  ) {

    const {
      error: viewInsertError
    } = await client
      .from("profile_views")
      .insert([
        {
          viewer_id:
            user.id,

          viewed_profile_id:
            profileId
        }
      ]);

    if (viewInsertError) {

      console.error(
        "Profile view record error:",
        viewInsertError.message
      );

    }

  }


  // ======================================
  // TARGET PROFILE LOAD
  // ======================================

  const {
    data: profile,
    error: profileError
  } = await client
    .from("profiles")
    .select("*")
    .eq(
      "id",
      profileId
    )
    .maybeSingle();

  if (profileError) {

    alert(
      "Profile load nahi hui: " +
      profileError.message
    );

    return;

  }

  if (!profile) {

    alert(
      "Profile record nahi mila."
    );

    return;

  }

  if (profile.blocked === true) {

    alert(
      "Ye profile available nahi hai."
    );

    window.location.href =
      "search.html";

    return;

  }


  // ======================================
  // PROFILE PHOTO
  // ======================================

  const viewPhoto =
    document.getElementById(
      "viewPhoto"
    );

  if (viewPhoto) {

    if (profile.profile_photo) {

      viewPhoto.src =
        profile.profile_photo;

      viewPhoto.style.display =
        "inline-block";

    } else {

      viewPhoto.removeAttribute(
        "src"
      );

      viewPhoto.style.display =
        "none";

    }

  }


  // ======================================
  // NAME + MEMBERSHIP BADGE
  // ======================================

  const membershipPlan =
    profile.membership_plan ||
    "Free";

  const membershipBadge =
    membershipPlan !== "Free"
      ? `
        <span style="
          display:inline-block;
          margin-left:8px;
          padding:5px 10px;
          border-radius:20px;
          background:#facc15;
          color:#422006;
          font-size:13px;
          font-weight:bold;
        ">
          👑 ${membershipPlan}
        </span>
      `
      : "";

  const viewName =
    document.getElementById(
      "viewName"
    );

  if (viewName) {

    viewName.innerHTML =
      (
        profile.full_name ||
        "DivyangSathi Member"
      ) +
      membershipBadge;

  }


  // ======================================
  // SAFE TEXT HELPER
  // ======================================

  function setProfileText(
    elementId,
    value
  ) {

    const element =
      document.getElementById(
        elementId
      );

    if (element) {

      element.textContent =
        value ?? "-";

    }

  }


  // ======================================
  // BASIC INFORMATION
  // ======================================

  setProfileText(
    "viewAge",
    profile.age
  );

  setProfileText(
    "viewGender",
    profile.gender
  );

  setProfileText(
    "viewReligion",
    profile.religion
  );

  setProfileText(
    "viewState",
    profile.state
  );

  setProfileText(
    "viewDistrict",
    profile.district
  );

  setProfileText(
    "viewEducation",
    profile.education
  );

  setProfileText(
    "viewOccupation",
    profile.occupation
  );

  setProfileText(
    "viewIncome",
    profile.income
  );

  setProfileText(
    "viewDisability",
    profile.disability_type
  );

  setProfileText(
    "viewAbout",
    profile.about_me
  );

  setProfileText(
    "viewPartner",
    profile.partner_preference
  );


  // ======================================
  // MEMBERSHIP INFORMATION
  // ======================================

  setProfileText(
    "viewMembership",
    membershipPlan
  );

  setProfileText(
    "viewVerified",
    profile.verified === true
      ? "✅ Verified"
      : "⏳ Pending"
  );

  // Aadhaar Badge

const aadhaarBadge =
document.getElementById(
"viewAadhaarBadge"
);

if(aadhaarBadge){

if(
profile.aadhaar_status ===
"approved"
){

aadhaarBadge.style.display =
"inline-block";

}else{

aadhaarBadge.style.display =
"none";

}

}
  setProfileText(
    "viewCount",
    Number(
      profile.profile_views || 0
    )
  );

// ======================================
// VOICE INTRO
// ======================================

if (
  profile.voice_intro_status === "approved" &&
  profile.voice_intro_url
) {

  document.getElementById(
    "viewVoiceIntroBox"
  ).style.display = "block";

  document.getElementById(
    "viewVoicePlayer"
  ).src =
    profile.voice_intro_url;

}


  // ======================================
  // SEND INTEREST BUTTON
  // ======================================

  const interestButton =
    document.getElementById(
      "interestButton"
    );

  if (interestButton) {

    interestButton.onclick =
      function () {

        sendInterest(profileId);

      };

  }


  // ======================================
  // CHAT BUTTON
  // ======================================

  const chatButton =
    document.getElementById(
      "chatButton"
    );

  if (chatButton) {

    chatButton.onclick =
      function () {

        window.location.href =
          "chat.html?id=" +
          encodeURIComponent(
            profileId
          );

      };

  }


  console.log(
    "Current Plan:",
    accessResult.plan
  );

  console.log(
    "Remaining Views:",
    accessResult.remaining_views
  );

}

loadViewProfile();

// ======================================
// CHAT SYSTEM
// ======================================


async function loadChat() {

  const box = document.getElementById("chatMessages");

  if (!box) return;

  const params = new URLSearchParams(window.location.search);

  const receiverId = params.get("id");

  if (!receiverId) return;

  const {
    data: { user }
  } = await client.auth.getUser();

  const { data, error } = await client
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
    )
    .order("created_at");

  if (error) {
    alert(error.message);
    return;
  }

  box.innerHTML = "";

  data.forEach(msg => {

    box.innerHTML += `
      <p>
        <b>${msg.sender_id === user.id ? "You" : "Partner"}:</b>
        ${msg.message}
      </p>
    `;

  });

}

// ======================================
// MEMBERSHIP PAYMENT
// ======================================

const submitMembership =
  document.getElementById("submitMembership");

if (submitMembership) {

  submitMembership.addEventListener(
    "click",
    async function (e) {

      e.preventDefault();

      const {
        data: { user },
        error: userError
      } = await client.auth.getUser();

      if (userError || !user) {
        alert("Please Login First");
        return;
      }

      const planElement =
        document.getElementById("membershipPlan");

      const amountElement =
        document.getElementById("membershipAmount");

      const utrElement =
        document.getElementById("utrNumber");

      const paymentStatus =
        document.getElementById("paymentStatus");

      const selectedPlan =
        planElement?.value.trim();

      const selectedAmount =
        Number(amountElement?.value || 0);

      const utr =
        utrElement?.value.trim();

      const validPlans = {
        Silver: 49,
        Gold: 99,
        Platinum: 199
      };

      if (
        !selectedPlan ||
        !Object.prototype.hasOwnProperty.call(
          validPlans,
          selectedPlan
        )
      ) {
        alert(
          "Please select Silver, Gold or Platinum plan."
        );
        return;
      }

      if (
        selectedAmount !== validPlans[selectedPlan]
      ) {
        alert(
          "Selected membership amount is invalid."
        );
        return;
      }

      if (!utr) {
        alert("Please Enter UTR Number");
        return;
      }

      if (utr.length < 6) {
        alert("Please enter a valid UTR number.");
        return;
      }

      submitMembership.disabled = true;
      submitMembership.textContent =
        "Submitting Request...";

      if (paymentStatus) {
        paymentStatus.textContent =
          "Membership request submit ho rahi hai...";
        paymentStatus.style.color = "#047857";
      }

      const {
        data: existingRequest,
        error: existingError
      } = await client
        .from("memberships")
        .select("id, payment_status")
        .eq("user_id", user.id)
        .eq("payment_status", "pending")
        .maybeSingle();

      if (existingError) {
        submitMembership.disabled = false;
        submitMembership.textContent =
          "✅ Submit Membership Request";

        alert(existingError.message);
        return;
      }

      if (existingRequest) {
        submitMembership.disabled = false;
        submitMembership.textContent =
          "✅ Submit Membership Request";

        if (paymentStatus) {
          paymentStatus.textContent =
            "Aapki ek membership request already pending hai.";
          paymentStatus.style.color = "#d97706";
        }

        alert(
          "Your membership request is already pending."
        );
        return;
      }

      const { error } = await client
        .from("memberships")
        .insert([
          {
            user_id: user.id,
            plan: selectedPlan,
            amount: selectedAmount,
            utr_number: utr,
            payment_status: "pending"
          }
        ]);

      submitMembership.disabled = false;
      submitMembership.textContent =
        "✅ Submit Membership Request";

      if (error) {
        if (paymentStatus) {
          paymentStatus.textContent =
            "Request failed: " + error.message;
          paymentStatus.style.color = "#dc2626";
        }

        alert(error.message);
        return;
      }

      if (paymentStatus) {
        paymentStatus.textContent =
          `✅ ${selectedPlan} membership request submitted successfully.`;
        paymentStatus.style.color = "#15803d";
      }

      try {
        const { data: payerProfile } = await client
          .from("profiles")
          .select("full_name, mobile, email")
          .eq("id", user.id)
          .maybeSingle();

        await dsSendPaymentWhatsApp({
          name: payerProfile?.full_name || "Member",
          mobile: payerProfile?.mobile || "-",
          email: payerProfile?.email || user.email || "-",
          amount: selectedAmount,
          plan: selectedPlan,
          utr: utr,
          time: new Date().toISOString()
        });

        await dsSendEmail(
          payerProfile?.email || user.email,
          "Membership Request Received",
          `<p>Your ${selectedPlan} membership request for ₹${selectedAmount} has been received. UTR: ${utr}. Admin verification is pending.</p>`
        );
      } catch (notifyError) {
        console.warn("Payment notifications skipped:", notifyError.message);
      }

      utrElement.value = "";

      alert(
        `${selectedPlan} Membership Request Submitted Successfully`
      );

    }
  );

}

// ======================================
// ADMIN MEMBERSHIP
// ======================================

async function loadPendingPayments() {

  const list = document.getElementById("paymentList");

  if (!list) return;

  const { data, error } = await client
    .from("memberships")
    .select("*")
    .eq("payment_status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = `<div class="feature-box">${error.message}</div>`;
    return;
  }

  if (data.length === 0) {
    list.innerHTML = `
    <div class="feature-box">
      <h3>🟡 No Pending Membership Requests</h3>
      <p>There are currently no pending payments.</p>
    </div>`;
    return;
  }

  list.innerHTML = "";

  data.forEach(item => {

    list.innerHTML += `

<div class="feature-box">

<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">

<h3 style="margin:0;color:#2563eb;">
💳 ${item.plan}
</h3>

<span style="
background:#facc15;
color:#222;
padding:6px 12px;
border-radius:20px;
font-size:13px;
font-weight:bold;">
Pending
</span>

</div>

<p><b>💰 Amount:</b> ₹${item.amount}</p>

<p><b>🧾 UTR Number:</b> ${item.utr_number}</p>

<p><b>📌 Status:</b> ${item.payment_status}</p>

<div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">

<button
style="
background:#22c55e;
color:white;
flex:1;"
onclick="approveMembership('${item.id}')">

✅ Approve

</button>

<button
style="
background:#ef4444;
color:white;
flex:1;"
onclick="rejectMembership('${item.id}')">

❌ Reject

</button>

</div>

</div>

`;

  });

}
// ======================================
// APPROVED PAYMENTS
// ======================================

async function loadApprovedPayments() {

  const list = document.getElementById("paymentList");

  if (!list) return;

  const { data, error } = await client
    .from("memberships")
    .select("*")
    .eq("payment_status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = `<div class="feature-box">${error.message}</div>`;
    return;
  }

  if (data.length === 0) {
    list.innerHTML = `
    <div class="feature-box">
      <h3>🟢 No Approved Memberships</h3>
      <p>No approved membership records found.</p>
    </div>`;
    return;
  }

  list.innerHTML = "";

  data.forEach(item => {

    list.innerHTML += `

<div class="feature-box">

<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">

<h3 style="margin:0;color:#16a34a;">
💳 ${item.plan}
</h3>

<span style="
background:#22c55e;
color:white;
padding:6px 12px;
border-radius:20px;
font-size:13px;
font-weight:bold;">
Approved
</span>

</div>

<p><b>💰 Amount:</b> ₹${item.amount}</p>

<p><b>🧾 UTR Number:</b> ${item.utr_number}</p>

<p><b>📌 Status:</b> Approved</p>

<div style="margin-top:20px;">

<button
disabled
style="
width:100%;
background:#16a34a;
color:white;
cursor:not-allowed;">

✅ Membership Approved

</button>

</div>

</div>

`;

  });

}

// ======================================
// REJECTED PAYMENTS
// ======================================

async function loadRejectedPayments() {

  const list = document.getElementById("paymentList");

  if (!list) return;

  const { data, error } = await client
    .from("memberships")
    .select("*")
    .eq("payment_status", "rejected")
    .order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = `<div class="feature-box">${error.message}</div>`;
    return;
  }

  if (data.length === 0) {
    list.innerHTML = `
    <div class="feature-box">
      <h3>🔴 No Rejected Memberships</h3>
      <p>No rejected membership records found.</p>
    </div>`;
    return;
  }

  list.innerHTML = "";

  data.forEach(item => {

    list.innerHTML += `

<div class="feature-box">

<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">

<h3 style="margin:0;color:#dc2626;">
💳 ${item.plan}
</h3>

<span style="
background:#dc2626;
color:white;
padding:6px 12px;
border-radius:20px;
font-size:13px;
font-weight:bold;">
Rejected
</span>

</div>

<p><b>💰 Amount:</b> ₹${item.amount}</p>

<p><b>🧾 UTR Number:</b> ${item.utr_number}</p>

<p><b>📌 Status:</b> Rejected</p>

<div style="margin-top:20px;">

<button
disabled
style="
width:100%;
background:#dc2626;
color:white;
cursor:not-allowed;">

❌ Membership Rejected

</button>

</div>

</div>

`;

  });

}

// ======================================
// ADMIN DASHBOARD COUNTS
// ======================================

async function loadAdminDashboard() {

  if (!(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))) return;

  // Total Profiles
  const { count: profileCount } = await client
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Total Users
  const totalUsers = document.getElementById("totalUsers");

  if (totalUsers) {
    totalUsers.innerText = profileCount || 0;
  }

  // Total Profiles
  const totalProfiles = document.getElementById("totalProfiles");

  if (totalProfiles) {
    totalProfiles.innerText = profileCount || 0;
  }

  // Pending Membership Requests
  const { count: membershipCount } = await client
    .from("memberships")
    .select("*", { count: "exact", head: true })
    .eq("payment_status", "pending");

  const membershipRequests =
    document.getElementById("membershipRequests");

  if (membershipRequests) {
    membershipRequests.innerText = membershipCount || 0;
  }

  // Approved Profiles
  const { count: approvedCount } = await client
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("verified", true);

  const approvedProfiles =
    document.getElementById("approvedProfiles");

  if (approvedProfiles) {
    approvedProfiles.innerText = approvedCount || 0;
  }

  // Blocked Profiles
  const { count: blockedCount } = await client
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("blocked", true);

  const blockedProfiles =
    document.getElementById("blockedProfiles");

  if (blockedProfiles) {
    blockedProfiles.innerText = blockedCount || 0;
  }
}

loadAdminDashboard();


// ======================================
// ADMIN MEMBERSHIP REQUESTS
// ======================================

async function loadMembershipRequests() {

  const list =
    document.getElementById("membershipList");

  if (!list) return;

  const { data, error } = await client
    .from("memberships")
    .select(`
      id,
      user_id,
      plan,
      amount,
      utr_number,
      payment_status,
      created_at,
      profiles!memberships_user_id_fkey(
        full_name,
        email
      )
    `)
    .eq("payment_status", "pending")
    .order("created_at", {
      ascending: false
    });

  if (error) {

    list.innerHTML = `
      <div class="feature-box">
        <h3>Membership requests load nahi hui</h3>
        <p>${error.message}</p>
      </div>
    `;

    return;
  }

  if (!data || data.length === 0) {

    list.innerHTML = `
      <div class="feature-box">
        <h3>No Pending Membership Requests</h3>
      </div>
    `;

    return;
  }

  list.innerHTML = "";

  data.forEach(item => {

    list.innerHTML += `

<div class="feature-box">

<p>
<strong>Name:</strong>
${item.profiles?.full_name || "-"}
</p>

<p>
<strong>Email:</strong>
${item.profiles?.email || "-"}
</p>

<p>
<strong>Plan:</strong>
${item.plan || "-"}
</p>

<p>
<strong>Amount:</strong>
₹${item.amount || 0}
</p>

<p>
<strong>UTR:</strong>
${item.utr_number || "-"}
</p>

<p>
<strong>Status:</strong>
${item.payment_status || "pending"}
</p>

<button
  type="button"
  class="approve-membership-btn"
  data-membership-id="${item.id}">
  ✅ Approve
</button>

<button
  type="button"
  class="reject-membership-btn"
  data-membership-id="${item.id}">
  ❌ Reject
</button>

</div>

`;

  });


  // Approve Buttons

  list
    .querySelectorAll(
      ".approve-membership-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async function () {

          const membershipId =
            this.getAttribute(
              "data-membership-id"
            );

          await approveMembership(
            membershipId
          );

        }
      );

    });


  // Reject Buttons

  list
    .querySelectorAll(
      ".reject-membership-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async function () {

          const membershipId =
            this.getAttribute(
              "data-membership-id"
            );

          await rejectMembership(
            membershipId
          );

        }
      );

    });

}

loadMembershipRequests();


// ======================================
// APPROVE MEMBERSHIP
// ======================================

async function approveMembership(id) {

  if (!id) {
    alert("Membership ID nahi mili.");
    return;
  }

  const confirmApprove = confirm(
    "Kya aap is membership ko approve karna chahte hain?"
  );

  if (!confirmApprove) return;


  // Membership request load karo

  const {
    data: membershipRequest,
    error: requestError
  } = await client
    .from("memberships")
    .select(`
      id,
      user_id,
      plan,
      amount,
      payment_status
    `)
    .eq("id", id)
    .maybeSingle();

  if (requestError) {

    alert(
      "Membership request load nahi hui: " +
      requestError.message
    );

    return;
  }

  if (!membershipRequest) {
    alert("Membership request nahi mili.");
    return;
  }


  const userId =
    membershipRequest.user_id;

  if (!userId) {

    alert(
      "Is membership request me User ID save nahi hai."
    );

    return;
  }


  const selectedPlan =
    membershipRequest.plan;

  const planSettings = {

    Silver: {
      amount: 49,
      views: 25
    },

    Gold: {
      amount: 99,
      views: 100
    },

    Platinum: {
      amount: 199,
      views: -1
    }

  };


  if (!planSettings[selectedPlan]) {

    alert(
      "Invalid membership plan: " +
      (selectedPlan || "Plan missing")
    );

    return;
  }


  const expectedAmount =
    planSettings[selectedPlan].amount;

  const allowedViews =
    planSettings[selectedPlan].views;


  if (
    Number(membershipRequest.amount) !==
    expectedAmount
  ) {

    alert(
      "Plan aur payment amount match nahi karte."
    );

    return;
  }


  const today = new Date();

  const expiry = new Date(today);

  expiry.setMonth(
    expiry.getMonth() + 6
  );


  const membershipStart =
    today
      .toISOString()
      .split("T")[0];

  const membershipExpiry =
    expiry
      .toISOString()
      .split("T")[0];


  // User profile update

  const {
    data: updatedProfile,
    error: profileError
  } = await client
    .from("profiles")
    .update({

      premium: true,

      membership_plan:
        selectedPlan,

      remaining_profile_views:
        allowedViews,

      membership_start:
        membershipStart,

      membership_expiry:
        membershipExpiry

    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();


  if (profileError) {

    alert(
      "Profile membership update nahi hui: " +
      profileError.message
    );

    return;
  }

  if (!updatedProfile) {

    alert(
      "Is User ID ka profile record nahi mila."
    );

    return;
  }


  // Request approve

  const { error: membershipError } =
    await client
      .from("memberships")
      .update({
        payment_status: "approved"
      })
      .eq("id", id);


  if (membershipError) {

    alert(
      "Membership approve nahi hui: " +
      membershipError.message
    );

    return;
  }


  try {
    await client.from("notifications").insert({
      user_id: userId,
      title: "Membership Approved",
      message: `${selectedPlan} membership approved successfully.`
    });
    const { data: approvedUser } = await client.from("profiles").select("email,full_name").eq("id",userId).maybeSingle();
    await dsSendEmail(approvedUser?.email,"Membership Approved",`<p>Hello ${approvedUser?.full_name || "Member"},</p><p>Your ${selectedPlan} membership has been approved successfully.</p>`);
  } catch (notifyError) { console.warn("Approval notification skipped:", notifyError.message); }

  alert(
    `${selectedPlan} Membership Approved Successfully ✅`
  );


  await loadMembershipRequests();

  await loadAdminDashboard();

}

// ======================================
// REJECT MEMBERSHIP
// ======================================

async function rejectMembership(id) {

  if (!id) {
    alert("Membership ID nahi mili.");
    return;
  }

  const confirmReject = confirm(
    "Kya aap is membership ko reject karna chahte hain?"
  );

  if (!confirmReject) return;

  const { data: rejectedRequest } = await client
    .from("memberships")
    .select("user_id, plan")
    .eq("id", id)
    .maybeSingle();

  const { error } = await client
    .from("memberships")
    .update({
      payment_status: "rejected"
    })
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  try {
    if (rejectedRequest?.user_id) {
      await client.from("notifications").insert({user_id:rejectedRequest.user_id,title:"Membership Rejected",message:`${rejectedRequest.plan || "Membership"} request was rejected. Please contact support if you need help.`});
      const { data: rejectedUser } = await client.from("profiles").select("email,full_name").eq("id",rejectedRequest.user_id).maybeSingle();
      await dsSendEmail(rejectedUser?.email,"Membership Update",`<p>Hello ${rejectedUser?.full_name || "Member"},</p><p>Your ${rejectedRequest.plan || "membership"} request was not approved. Please contact support for assistance.</p>`);
    }
  } catch (notifyError) { console.warn("Rejection notification skipped:", notifyError.message); }

  alert("Membership Rejected");

  await loadMembershipRequests();
  await loadAdminDashboard();

}

// ======================================
// SAFE CHAT SYSTEM
// ======================================

(function () {

  // Sirf chat.html page par chalega
  const currentPage =
    window.location.pathname
      .split("/")
      .pop();

  if (currentPage !== "chat.html") {
    return;
  }

  let activeChatUserId = null;
  let loggedInChatUser = null;
  let chatRefreshTimer = null;
  let chatRealtimeChannel = null;

  const chatUsersContainer =
    document.getElementById("chatUsers");

  const chatMessageBox =
    document.getElementById("chatBox");

  const chatMessageInput =
    document.getElementById("messageText");

  const chatSendButton =
    document.getElementById("sendMessageBtn");

  const chatUserName =
    document.getElementById("chatUserName");

  const chatConnectionStatus =
    document.getElementById("chatConnectionStatus");

  const chatAccessNotice =
    document.getElementById("chatAccessNotice");

  const chatViewProfileButton =
    document.getElementById("chatViewProfileButton");

  const chatUserMembership =
    document.getElementById("chatUserMembership");

  const chatUserPhoto =
    document.getElementById("chatUserPhoto");

  const chatUserPhotoPlaceholder =
    document.getElementById(
      "chatUserPhotoPlaceholder"
    );

  const chatCharacterCount =
    document.getElementById(
      "chatCharacterCount"
    );

  const refreshChatUsersButton =
    document.getElementById(
      "refreshChatUsers"
    );


  // ======================================
  // INITIALIZE CHAT
  // ======================================

  async function initializeSafeChat() {

    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();

    if (userError || !user) {
      alert("Please login first.");
      window.location.replace("login.html");
      return;
    }

    loggedInChatUser = user;

    await loadSafeChatUsers();

    const params =
      new URLSearchParams(
        window.location.search
      );

    const receiverId =
      params.get("id");

    if (receiverId) {
      await openSafeChat(receiverId);
    }

    startSafeChatRealtime();

  }


  // ======================================
  // LOAD ACCEPTED CHAT USERS
  // ======================================

  async function loadSafeChatUsers() {

    if (
      !chatUsersContainer ||
      !loggedInChatUser
    ) {
      return;
    }

    chatUsersContainer.innerHTML = `
      <div class="chat-loading-state">
        <p>Loading conversations...</p>
      </div>
    `;

    const {
      data: acceptedInterests,
      error: interestError
    } = await client
      .from("interests")
      .select(`
        id,
        sender_id,
        receiver_id,
        status
      `)
      .eq("status", "accepted")
      .or(
        `sender_id.eq.${loggedInChatUser.id},receiver_id.eq.${loggedInChatUser.id}`
      );

    if (interestError) {

      chatUsersContainer.innerHTML = `
        <div class="chat-loading-state">
          <p>${interestError.message}</p>
        </div>
      `;

      return;
    }

    if (
      !acceptedInterests ||
      acceptedInterests.length === 0
    ) {

      chatUsersContainer.innerHTML = `
        <div class="chat-loading-state">
          <p>No connected users found.</p>
        </div>
      `;

      return;
    }

    const otherUserIds = [
      ...new Set(
        acceptedInterests.map(item => {

          return item.sender_id ===
            loggedInChatUser.id
            ? item.receiver_id
            : item.sender_id;

        })
      )
    ].filter(Boolean);

    const {
      data: profiles,
      error: profileError
    } = await client
      .from("profiles")
      .select(`
        id,
        full_name,
        profile_photo,
        membership_plan,
        blocked
      `)
      .in("id", otherUserIds);

    if (profileError) {

      chatUsersContainer.innerHTML = `
        <div class="chat-loading-state">
          <p>${profileError.message}</p>
        </div>
      `;

      return;
    }

    chatUsersContainer.innerHTML = "";

    (profiles || [])
      .filter(profile =>
        profile.blocked !== true
      )
      .forEach(profile => {

        const item =
          document.createElement("button");

        item.type = "button";

        item.style.width = "100%";
        item.style.padding = "14px";
        item.style.border = "1px solid #e5e7eb";
        item.style.borderRadius = "12px";
        item.style.background = "#ffffff";
        item.style.cursor = "pointer";
        item.style.textAlign = "left";
        item.style.marginBottom = "10px";

        item.innerHTML = `
          <strong>
            ${profile.full_name || "DivyangSathi Member"}
          </strong>

          <br>

          <small>
            ${profile.membership_plan || "Free"} Member
          </small>
        `;

        item.addEventListener(
          "click",
          function () {

            openSafeChat(profile.id);

          }
        );

        chatUsersContainer.appendChild(item);

      });

  }


  // ======================================
  // CHECK ACCEPTED CONNECTION
  // ======================================

  async function hasAcceptedChatConnection(
    receiverId
  ) {

    const {
      data,
      error
    } = await client
      .from("interests")
      .select("id, status")
      .eq("status", "accepted")
      .or(
        `and(sender_id.eq.${loggedInChatUser.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${loggedInChatUser.id})`
      )
      .limit(1);

    if (error) {
      console.error(
        "Chat connection error:",
        error.message
      );
      return false;
    }

    return Array.isArray(data) &&
      data.length > 0;

  }


  // ======================================
  // OPEN CHAT
  // ======================================

  async function openSafeChat(receiverId) {

    if (
      !receiverId ||
      !loggedInChatUser
    ) {
      return;
    }

    if (
      receiverId === loggedInChatUser.id
    ) {
      alert("Aap khud se chat nahi kar sakte.");
      return;
    }

    const isConnected =
      await hasAcceptedChatConnection(
        receiverId
      );

    if (!isConnected) {

      activeChatUserId = null;

      if (chatMessageInput) {
        chatMessageInput.disabled = true;
      }

      if (chatSendButton) {
        chatSendButton.disabled = true;
      }

      if (chatConnectionStatus) {
        chatConnectionStatus.textContent =
          "🔒 Interest Not Accepted";
      }

      if (chatAccessNotice) {
        chatAccessNotice.style.display =
          "flex";
      }

      alert(
        "Chat ke liye accepted interest zaroori hai."
      );

      return;
    }

    const {
      data: profile,
      error: profileError
    } = await client
      .from("profiles")
      .select(`
        id,
        full_name,
        profile_photo,
        membership_plan,
        blocked
      `)
      .eq("id", receiverId)
      .maybeSingle();

    if (
      profileError ||
      !profile
    ) {

      alert(
        profileError?.message ||
        "Chat user profile nahi mili."
      );

      return;
    }

    if (profile.blocked === true) {
      alert("Ye profile available nahi hai.");
      return;
    }

    activeChatUserId = receiverId;

    if (chatUserName) {
      chatUserName.textContent =
        profile.full_name ||
        "DivyangSathi Member";
    }

    if (chatConnectionStatus) {
      chatConnectionStatus.textContent =
        "🟢 Connected";
    }

    if (chatAccessNotice) {
      chatAccessNotice.style.display =
        "none";
    }

    if (chatMessageInput) {
      chatMessageInput.disabled = false;
      chatMessageInput.focus();
    }

    if (chatSendButton) {
      chatSendButton.disabled = false;
    }

    if (chatViewProfileButton) {
      chatViewProfileButton.href =
        "view-profile.html?id=" +
        receiverId;
    }

    if (chatUserMembership) {

      chatUserMembership.style.display =
        "inline-block";

      chatUserMembership.textContent =
        profile.membership_plan ||
        "Free";

    }

    if (
      profile.profile_photo &&
      chatUserPhoto
    ) {

      chatUserPhoto.src =
        profile.profile_photo;

      chatUserPhoto.style.display =
        "block";

      if (chatUserPhotoPlaceholder) {
        chatUserPhotoPlaceholder.style.display =
          "none";
      }

    } else {

      if (chatUserPhoto) {
        chatUserPhoto.style.display =
          "none";
      }

      if (chatUserPhotoPlaceholder) {
        chatUserPhotoPlaceholder.style.display =
          "flex";
      }

    }

    const newUrl =
      "chat.html?id=" + receiverId;

    window.history.replaceState(
      {},
      "",
      newUrl
    );

    await loadSafeMessages();

    startSafeChatAutoRefresh();

  }


  // ======================================
  // LOAD MESSAGES
  // ======================================

  async function loadSafeMessages() {

    if (
      !activeChatUserId ||
      !loggedInChatUser ||
      !chatMessageBox
    ) {
      return;
    }

    const {
      data: messages,
      error
    } = await client
      .from("chats")
      .select(`
        id,
        sender_id,
        receiver_id,
        message,
        is_read,
        created_at
      `)
      .or(
        `and(sender_id.eq.${loggedInChatUser.id},receiver_id.eq.${activeChatUserId}),and(sender_id.eq.${activeChatUserId},receiver_id.eq.${loggedInChatUser.id})`
      )
      .order("created_at", {
        ascending: true
      });

    if (error) {

      chatMessageBox.innerHTML = `
        <div class="chat-empty-state">
          <p>${error.message}</p>
        </div>
      `;

      return;
    }

    chatMessageBox.innerHTML = "";

    if (
      !messages ||
      messages.length === 0
    ) {

      chatMessageBox.innerHTML = `
        <div class="chat-empty-state">
          <div class="chat-empty-icon">💬</div>

          <h3>No Messages Yet</h3>

          <p>
            Respectful conversation start karein.
          </p>
        </div>
      `;

      return;
    }

    messages.forEach(messageItem => {

      const isMine =
        messageItem.sender_id ===
        loggedInChatUser.id;

      const messageElement =
        document.createElement("div");

      messageElement.className =
        isMine
          ? "chat-message sent"
          : "chat-message received";

      const safeMessage =
        escapeChatMessage(
          messageItem.message || ""
        );

      const time =
        messageItem.created_at
          ? new Date(
              messageItem.created_at
            ).toLocaleString("en-IN")
          : "";

      messageElement.innerHTML = `
        <div>${safeMessage}</div>

        <span class="chat-message-time">
          ${time}
          ${isMine
            ? messageItem.is_read
              ? " • Seen"
              : " • Sent"
            : ""}
        </span>
      `;

      chatMessageBox.appendChild(
        messageElement
      );

    });

    chatMessageBox.scrollTop =
      chatMessageBox.scrollHeight;

    await markSafeMessagesAsRead();

  }


  // ======================================
  // SEND MESSAGE
  // ======================================

  async function sendSafeMessage() {

    if (
      !activeChatUserId ||
      !loggedInChatUser
    ) {

      alert("Select a chat first.");
      return;
    }

    const text =
      chatMessageInput?.value.trim();

    if (!text) return;

    const isConnected =
      await hasAcceptedChatConnection(
        activeChatUserId
      );

    if (!isConnected) {

      alert(
        "Chat connection accepted nahi hai."
      );

      return;
    }

    chatSendButton.disabled = true;

    const { error } = await client
      .from("chats")
      .insert([
        {
          sender_id:
            loggedInChatUser.id,

          receiver_id:
            activeChatUserId,

          message:
            text,

          is_read:
            false
        }
      ]);

      await client
  .from("notifications")
  .insert([
    {
      user_id: activeChatUserId,
      title: "💬 New Message",
      message: "You have received a new message."
    }
  ]);

    chatSendButton.disabled = false;

    if (error) {

      alert(
        "Message send nahi hua: " +
        error.message
      );

      return;
    }

    chatMessageInput.value = "";

    updateChatCharacterCount();

    await loadSafeMessages();

  }


  // ======================================
  // MARK AS READ
  // ======================================

  async function markSafeMessagesAsRead() {

    if (
      !activeChatUserId ||
      !loggedInChatUser
    ) {
      return;
    }

    const { error } = await client
      .from("chats")
      .update({
        is_read: true
      })
      .eq(
        "sender_id",
        activeChatUserId
      )
      .eq(
        "receiver_id",
        loggedInChatUser.id
      )
      .eq("is_read", false);

    if (error) {
      console.error(
        "Message read update error:",
        error.message
      );
    }

  }


  // ======================================
  // SAFE TEXT DISPLAY
  // ======================================

  function escapeChatMessage(value) {

    const element =
      document.createElement("div");

    element.textContent = value;

    return element.innerHTML;

  }


  // ======================================
  // CHARACTER COUNT
  // ======================================

  function updateChatCharacterCount() {

    if (
      !chatMessageInput ||
      !chatCharacterCount
    ) {
      return;
    }

    chatCharacterCount.textContent =
      chatMessageInput.value.length +
      " / 1000";

  }


  // ======================================
  // AUTO REFRESH
  // ======================================

  function startSafeChatAutoRefresh() {

    if (chatRefreshTimer) {
      clearInterval(chatRefreshTimer);
    }

    chatRefreshTimer =
      setInterval(function () {

        if (activeChatUserId) {
          loadSafeMessages();
        }

      }, 3000);

  }


  // ======================================
  // REALTIME CHAT
  // ======================================

  function startSafeChatRealtime() {

    if (chatRealtimeChannel) {
      client.removeChannel(
        chatRealtimeChannel
      );
    }

    chatRealtimeChannel =
      client
        .channel(
          "divyangsathi-safe-chat"
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chats"
          },
          function (payload) {

            const row =
              payload.new;

            if (
              activeChatUserId &&
              (
                (
                  row.sender_id ===
                    loggedInChatUser.id &&
                  row.receiver_id ===
                    activeChatUserId
                ) ||
                (
                  row.sender_id ===
                    activeChatUserId &&
                  row.receiver_id ===
                    loggedInChatUser.id
                )
              )
            ) {
              loadSafeMessages();
            }

          }
        )
        .subscribe();

  }


  // ======================================
  // EVENT LISTENERS
  // ======================================

  if (chatSendButton) {

    chatSendButton.addEventListener(
      "click",
      sendSafeMessage
    );

  }

  if (chatMessageInput) {

    chatMessageInput.addEventListener(
      "input",
      updateChatCharacterCount
    );

    chatMessageInput.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          sendSafeMessage();

        }

      }
    );

  }

  if (refreshChatUsersButton) {

    refreshChatUsersButton.addEventListener(
      "click",
      loadSafeChatUsers
    );

  }


  // Start chat system
  initializeSafeChat();

})();

// ======================================
// LOAD ADMIN PROFILES
// ======================================

async function loadAdminProfiles() {

  if (!(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))) return;

  const container =
    document.getElementById("adminProfiles");

  if (!container) return;

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = `
      <div class="feature-box">
        ${error.message}
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="feature-box">
        <h3>No Profiles Found</h3>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  data.forEach(profile => {

    const firstLetter =
      (profile.full_name || "U")
        .charAt(0)
        .toUpperCase();

    container.innerHTML += `


<div
  class="feature-box"
  style="border-radius:18px;padding:20px;">

<div style="
display:flex;
align-items:center;
gap:15px;
margin-bottom:20px;">

<div style="
width:70px;
height:70px;
border-radius:50%;
background:linear-gradient(135deg,#2563eb,#7c3aed);
display:flex;
align-items:center;
justify-content:center;
font-size:28px;
font-weight:bold;
color:white;">

${firstLetter}

</div>

<div>

<h3 style="margin:0;">
${profile.full_name || "-"}
</h3>

<div style="
margin-top:8px;
display:flex;
gap:8px;
flex-wrap:wrap;">

<span style="
background:${profile.verified ? "#22c55e" : "#ef4444"};
color:white;
padding:5px 12px;
border-radius:20px;
font-size:12px;
font-weight:bold;">

${profile.verified ? "✔ Verified" : "❌ Not Verified"}

</span>

<span style="
background:${profile.blocked ? "#dc2626" : "#2563eb"};
color:white;
padding:5px 12px;
border-radius:20px;
font-size:12px;
font-weight:bold;">

${profile.blocked ? "🚫 Blocked" : "✅ Active"}

</span>

</div>

</div>

</div>

<hr style="margin:15px 0;opacity:.2;">

<p>
<b>📧 Email</b><br>
${profile.email || "-"}
</p>

<p>
<b>📱 Mobile</b><br>
${profile.mobile || "-"}
</p>

<p>
<b>🎂 Age</b><br>
${profile.age || "-"}
</p>

<p>
<b>⚧ Gender</b><br>
${profile.gender || "-"}
</p>

<p>
<b>♿ Disability</b><br>
${profile.disability_type || "-"}
</p>

<p>
<b>🎓 Education</b><br>
${profile.education || "-"}
</p>

<p>
<b>💼 Occupation</b><br>
${profile.occupation || "-"}
</p>

<p>
<b>📍 State</b><br>
${profile.state || "-"}
</p>

<p>
<b>🏙 District</b><br>
${profile.district || "-"}
</p>

<div style="
display:flex;
gap:10px;
margin-top:20px;
flex-wrap:wrap;">

${
  profile.verified

    ?

    `<button
      disabled
      style="
      background:#16a34a;
      color:white;
      flex:1;
      cursor:not-allowed;">

      ✔ Verified

    </button>`

    :

    `<button
      onclick="verifyProfile('${profile.id}')"
      style="
      background:#2563eb;
      color:white;
      flex:1;">

      ✔ Verify

    </button>`
}

${
  profile.blocked

    ?

    `<button
      onclick="unblockProfile('${profile.id}')"
      style="
      background:#22c55e;
      color:white;
      flex:1;">

      🔓 Unblock

    </button>`

    :

    `<button
      onclick="blockProfile('${profile.id}')"
      style="
      background:#dc2626;
      color:white;
      flex:1;">

      🚫 Block

    </button>`
}

<br><br>

${
  profile.intro_video_url
    ? `
      <div style="
        margin-top:18px;
        padding:15px;
        background:#f8fafc;
        border-radius:12px;">

        <h4 style="margin:0 0 10px;">
          🎥 Intro Video
        </h4>

        <video
          controls
          src="${profile.intro_video_url}"
          style="
            width:100%;
            max-height:260px;
            border-radius:10px;
            background:#000;">
        </video>

        <p style="margin:10px 0;">
          <strong>Status:</strong>
          ${profile.intro_video_status || "not_uploaded"}
        </p>

        <div style="
          display:flex;
          gap:10px;
          flex-wrap:wrap;">

          <button
            type="button"
            onclick="approveIntroVideo('${profile.id}')"
            style="
              flex:1;
              background:#16a34a;
              color:#fff;">

            ✅ Approve Video

          </button>

          <button
            type="button"
            onclick="rejectIntroVideo('${profile.id}')"
            style="
              flex:1;
              background:#dc2626;
              color:#fff;">

            ❌ Reject Video

          </button>

        </div>

      </div>
    `
    : ""
}

${
  profile.voice_intro_url
    ? `
      <div style="
        margin-top:18px;
        padding:15px;
        background:#f8fafc;
        border-radius:12px;">

        <h4>
          🎙️ Voice Intro
        </h4>

        <audio
          controls
          src="${profile.voice_intro_url}"
          style="width:100%;">
        </audio>

        <p>
          Status:
          ${profile.voice_intro_status || "pending"}
        </p>

        <button
          type="button"
          onclick="approveVoiceIntro('${profile.id}')"
          style="background:#16a34a;color:white;">

          ✅ Approve Voice

        </button>

        <button
          type="button"
          onclick="rejectVoiceIntro('${profile.id}')"
          style="background:#dc2626;color:white;">

          ❌ Reject Voice

        </button>

      </div>
    `
    : ""
}

<button
onclick="downloadAdminProfilePdf('${profile.id}')"
style="
background:#0f766e;
color:white;
width:100%;">

📄 Download PDF

</button>

</div>

</div>

`;

  });

}

loadAdminProfiles();


// ======================================
// VERIFY PROFILE
// ======================================

async function verifyProfile(id) {

  const { error } = await client
    .from("profiles")
    .update({
      verified: true
    })
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Profile Verified Successfully");

  loadAdminProfiles();
  loadAdminDashboard();

}


// ===============================
// CONTACT FORM
// ===============================

const contactForm =
  document.getElementById("contactForm");

if (contactForm) {

  contactForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const full_name =
        document
          .getElementById("contactName")
          .value
          .trim();

      const mobile =
        document
          .getElementById("contactMobile")
          .value
          .trim();

      const email =
        document
          .getElementById("contactEmail")
          .value
          .trim();

      const subject =
        document
          .getElementById("contactSubject")
          .value
          .trim();

      const message =
        document
          .getElementById("contactMessage")
          .value
          .trim();

      const { error } = await client
        .from("contact_messages")
        .insert([
          {
            full_name,
            mobile,
            email,
            subject,
            message
          }
        ]);

      if (error) {
        alert(
          "Message send failed: " +
          error.message
        );
        return;
      }

      alert("Message Sent Successfully ✅");

      contactForm.reset();

    }
  );

}


// =====================================
// ADMIN CONTACT MESSAGES
// =====================================

async function loadContactMessages() {

  if (!(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))) return;

  const container =
    document.getElementById("contactMessages");

  if (!container) return;

  const { data, error } = await client
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = `
      <div class="feature-box">
        <h3>❌ Error</h3>
        <p>${error.message}</p>
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="feature-box">
        <h3>📭 No Contact Messages</h3>
        <p>No contact messages found.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  data.forEach(item => {

    const messageDate =
      item.created_at
        ? new Date(item.created_at).toLocaleString()
        : "-";

    const firstLetter =
      (item.full_name || "U")
        .charAt(0)
        .toUpperCase();

    container.innerHTML += `

<div
  class="feature-box"
  style="border-radius:18px;padding:20px;">

<div style="
display:flex;
align-items:center;
gap:15px;
margin-bottom:20px;">

<div style="
width:65px;
height:65px;
border-radius:50%;
background:linear-gradient(135deg,#2563eb,#7c3aed);
display:flex;
align-items:center;
justify-content:center;
font-size:26px;
font-weight:bold;
color:white;">

${firstLetter}

</div>

<div>

<h3 style="margin:0;">
${item.subject || "No Subject"}
</h3>

<span style="
display:inline-block;
margin-top:8px;
background:#2563eb;
color:white;
padding:5px 12px;
border-radius:20px;
font-size:12px;
font-weight:bold;">

📩 Contact Message

</span>

</div>

</div>

<hr style="margin:15px 0;opacity:.2;">

<p>
<b>👤 Name</b><br>
${item.full_name || "-"}
</p>

<p>
<b>📱 Mobile</b><br>
${item.mobile || "-"}
</p>

<p>
<b>📧 Email</b><br>
${item.email || "-"}
</p>

<p>
<b>💬 Message</b><br>
${item.message || "-"}
</p>

<p>
<b>🕒 Date</b><br>
${messageDate}
</p>

<div style="margin-top:20px;">

<button
  onclick="deleteContactMessage('${item.id}')"
  style="
  width:100%;
  background:#dc2626;
  color:white;">

  🗑️ Delete Message

</button>

</div>

</div>

`;

  });

}

loadContactMessages();


async function deleteContactMessage(messageId) {

  const confirmDelete = confirm(
    "Kya aap ye contact message delete karna chahte hain?"
  );

  if (!confirmDelete) return;

  const { data, error } = await client
    .from("contact_messages")
    .delete()
    .eq("id", messageId)
    .select();

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  if (!data || data.length === 0) {
    alert(
      "Delete permission nahi mili. RLS policy check kare."
    );
    return;
  }

  alert("Message Deleted Successfully ✅");

  loadContactMessages();

}


// ======================================
// SEPARATE ADMIN LOGIN SYSTEM
// ======================================

const ADMIN_LOGIN_PAGE =
  "admin-login.html";

const ADMIN_DASHBOARD_PAGE =
  "admin.html";

const adminLoginForm =
  document.getElementById("adminLoginForm");

if (adminLoginForm) {

  adminLoginForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      const emailInput =
        document.getElementById("adminEmail");

      const passwordInput =
        document.getElementById("adminPassword");

      const messageBox =
        document.getElementById("adminLoginMessage");

      const submitButton =
        adminLoginForm.querySelector(
          'button[type="submit"]'
        );

      const email =
        emailInput.value.trim();

      const password =
        passwordInput.value;

      if (!email || !password) {
        messageBox.style.color = "red";
        messageBox.textContent =
          "Email aur password enter karein.";
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent =
        "Checking Admin...";

      messageBox.style.color = "#2563eb";
      messageBox.textContent =
        "Admin account verify ho raha hai...";

      const {
        data: loginData,
        error: loginError
      } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) {
        messageBox.style.color = "red";
        messageBox.textContent =
          "Login failed: " +
          loginError.message;

        submitButton.disabled = false;
        submitButton.textContent =
          "Login as Admin";

        return;
      }

      const user = loginData.user;

      if (!user) {
        messageBox.style.color = "red";
        messageBox.textContent =
          "Admin account nahi mila.";

        submitButton.disabled = false;
        submitButton.textContent =
          "Login as Admin";

        return;
      }

      const {
        data: adminRecord,
        error: adminError
      } = await client
        .from("admins")
        .select(
          "id, email, full_name, active"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (
        adminError ||
        !adminRecord ||
        adminRecord.active !== true
      ) {

        await client.auth.signOut({ scope: "local" });

        messageBox.style.color = "red";
        messageBox.textContent =
          "Access denied. Ye account admin nahi hai.";

        submitButton.disabled = false;
        submitButton.textContent =
          "Login as Admin";

        return;
      }

      messageBox.style.color = "green";
      messageBox.textContent =
        "Admin Login Successful ✅";

      window.location.replace(
        ADMIN_DASHBOARD_PAGE
      );

    }
  );

}


// ======================================
// PROTECT ADMIN DASHBOARD
// ======================================

async function protectAdminDashboard() {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop();

  if (currentPage !== ADMIN_DASHBOARD_PAGE) {
    return;
  }

  const {
    data: { user },
    error: userError
  } = await client.auth.getUser();

  if (userError || !user) {
    window.location.replace(
      ADMIN_LOGIN_PAGE
    );
    return;
  }

  const {
    data: adminRecord,
    error: adminError
  } = await client
    .from("admins")
    .select("id, active")
    .eq("id", user.id)
    .maybeSingle();

  if (
    adminError ||
    !adminRecord ||
    adminRecord.active !== true
  ) {

    await client.auth.signOut({ scope: "local" });

    alert("Admin access denied.");

    window.location.replace(
      ADMIN_LOGIN_PAGE
    );

    return;
  }

}


// ======================================
// ADMIN LOGOUT
// ======================================

async function adminLogout() {

  const confirmLogout = confirm(
    "Kya aap Admin Panel se logout karna chahte hain?"
  );

  if (!confirmLogout) return;

  const adminLogoutBtn =
    document.getElementById(
      "adminLogoutBtn"
    );

  if (adminLogoutBtn) {
    adminLogoutBtn.disabled = true;
    adminLogoutBtn.textContent =
      "Logging out...";
  }

  const { error } =
    await client.auth.signOut({ scope: "local" });

  if (error) {
    alert(
      "Logout failed: " +
      error.message
    );

    if (adminLogoutBtn) {
      adminLogoutBtn.disabled = false;
      adminLogoutBtn.textContent =
        "🔓 Admin Logout";
    }

    return;
  }

  window.location.replace(
    ADMIN_LOGIN_PAGE
  );

}


const adminLogoutBtn =
  document.getElementById(
    "adminLogoutBtn"
  );

if (adminLogoutBtn) {

  adminLogoutBtn.addEventListener(
    "click",
    adminLogout
  );

}


// ======================================
// REDIRECT LOGGED-IN ADMIN
// ======================================

async function redirectLoggedInAdmin() {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop();

  if (currentPage !== ADMIN_LOGIN_PAGE) {
    return;
  }

  const {
    data: { user }
  } = await client.auth.getUser();

  if (!user) return;

  const { data: adminRecord } =
    await client
      .from("admins")
      .select("id, active")
      .eq("id", user.id)
      .maybeSingle();

  if (
    adminRecord &&
    adminRecord.active === true
  ) {

    window.location.replace(
      ADMIN_DASHBOARD_PAGE
    );

  }

}


protectAdminDashboard();
redirectLoggedInAdmin();

// ======================================
// PROFILE VIEW COUNTER
// ======================================

async function increaseProfileView(profileId) {

  if (!profileId) return;

  const { data } = await client
    .from("profiles")
    .select("profile_views")
    .eq("id", profileId)
    .single();

  if (!data) return;

  await client
    .from("profiles")
    .update({
      profile_views: (data.profile_views || 0) + 1,
      last_active: new Date().toISOString()
    })
    .eq("id", profileId);

}

// ======================================
// ADD / REMOVE FAVOURITE
// ======================================

async function toggleFavourite(profileId) {

  const {
    data: { user }
  } = await client.auth.getUser();

  if (!user) {
    alert("Please login first.");
    return;
  }

  // Apni profile favourite nahi kar sakte
  if (user.id === profileId) {
    alert("You cannot favourite your own profile.");
    return;
  }

  const { data: existing } = await client
    .from("favourites")
    .select("id")
    .eq("user_id", user.id)
    .eq("favourite_profile_id", profileId)
    .maybeSingle();

  if (existing) {

    await client
      .from("favourites")
      .delete()
      .eq("id", existing.id);

    alert("Removed from Favourite ❤️");

  } else {

    await client
      .from("favourites")
      .insert({
        user_id: user.id,
        favourite_profile_id: profileId
      });

    alert("Added to Favourite ❤️");

  }

}

// ======================================
// LOAD CURRENT MEMBERSHIP STATUS
// ======================================

async function loadCurrentMembershipStatus() {

  const planElement =
    document.getElementById("currentMembershipPlan");

  const viewsElement =
    document.getElementById("currentMembershipViews");

  // Sirf membership.html par chalega
  if (!planElement || !viewsElement) return;

  const {
    data: { user },
    error: userError
  } = await client.auth.getUser();

  if (userError || !user) {

    planElement.textContent = "Free";

    viewsElement.textContent =
      "Please login to check membership";

    return;
  }

  const {
    data: profile,
    error: profileError
  } = await client
    .from("profiles")
    .select(`
      membership_plan,
      remaining_profile_views,
      premium,
      membership_expiry
    `)
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {

    console.error(
      "Membership status load error:",
      profileError
    );

    viewsElement.textContent =
      "Membership status load nahi hui";

    return;
  }

  if (!profile) {

    planElement.textContent = "Free";

    viewsElement.textContent =
      "Profile record nahi mila";

    return;
  }

  const currentPlan =
    profile.membership_plan || "Free";

  planElement.textContent = currentPlan;

  if (currentPlan === "Platinum") {

    viewsElement.textContent =
      "Unlimited Profile Views";

  } else {

    const remainingViews =
      Number(profile.remaining_profile_views || 0);

    viewsElement.textContent =
      remainingViews + " Profile Views Available";

  }

  if (
    profile.premium === true &&
    profile.membership_expiry
  ) {

    viewsElement.textContent +=
      " • Valid Till: " +
      profile.membership_expiry;

  }

}

loadCurrentMembershipStatus();

// ======================================
// ADMIN BLOCK / UNBLOCK PROFILE
// ======================================

async function blockProfile(userId) {

  if (!userId) {
    alert("User ID nahi mili.");
    return;
  }

  const confirmBlock = confirm(
    "Kya aap is profile ko block karna chahte hain?"
  );

  if (!confirmBlock) return;

  const { data, error } = await client
    .from("profiles")
    .update({
      blocked: true
    })
    .eq("id", userId)
    .select("id, blocked")
    .maybeSingle();

  if (error) {
    alert("Profile block nahi hui: " + error.message);
    return;
  }

  if (!data) {
    alert("Profile record nahi mila ya update permission nahi hai.");
    return;
  }

  alert("Profile Blocked Successfully 🚫");

  if (typeof loadAdminProfiles === "function") {
    await loadAdminProfiles();
  }

  if (typeof loadAdminDashboard === "function") {
    await loadAdminDashboard();
  }

}


async function unblockProfile(userId) {

  if (!userId) {
    alert("User ID nahi mili.");
    return;
  }

  const confirmUnblock = confirm(
    "Kya aap is profile ko unblock karna chahte hain?"
  );

  if (!confirmUnblock) return;

  const { data, error } = await client
    .from("profiles")
    .update({
      blocked: false
    })
    .eq("id", userId)
    .select("id, blocked")
    .maybeSingle();

  if (error) {
    alert("Profile unblock nahi hui: " + error.message);
    return;
  }

  if (!data) {
    alert("Profile record nahi mila ya update permission nahi hai.");
    return;
  }

  alert("Profile Unblocked Successfully ✅");

  if (typeof loadAdminProfiles === "function") {
    await loadAdminProfiles();
  }

  if (typeof loadAdminDashboard === "function") {
    await loadAdminDashboard();
  }

}

// ======================================
// GLOBAL BLOCKED USER PROTECTION
// ======================================

async function protectBlockedUser() {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop();

  // Admin pages par blocked-user check nahi chalega
  if (
    currentPage.startsWith("admin")
  ) {
    return;
  }

  const {
    data: { user },
    error: userError
  } = await client.auth.getUser();

  // Login nahi hai to kuch mat karo
  if (userError || !user) return;


  // Admin account ko block check se bahar rakho
  const {
    data: adminRecord
  } = await client
    .from("admins")
    .select("id, active")
    .eq("id", user.id)
    .maybeSingle();

  if (
    adminRecord &&
    adminRecord.active === true
  ) {
    return;
  }


  // User ka blocked status check
  const {
    data: profile,
    error: profileError
  } = await client
    .from("profiles")
    .select("id, blocked")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "Blocked status check error:",
      profileError.message
    );
    return;
  }

  if (
    profile &&
    profile.blocked === true
  ) {

    await client.auth.signOut({ scope: "local" });

    alert(
      "Your account has been blocked by Admin. Please contact DivyangSathi Support."
    );

    window.location.replace("login.html");

  }

}


// Har page load par blocked status check
document.addEventListener(
  "DOMContentLoaded",
  protectBlockedUser
);

// ======================================
// ADMIN INTEREST MANAGEMENT
// ======================================

async function loadAdminInterests(statusFilter = "all") {

  const list =
    document.getElementById("adminInterestList");

  if (!list) return;

  list.innerHTML = `
    <div class="admin-loading-card">
      <div class="admin-loader"></div>
      <p>Loading Interest Requests...</p>
    </div>
  `;

  let query = client
    .from("interests")
    .select(`
      id,
      sender_id,
      receiver_id,
      status,
      created_at
    `)
    .order("created_at", {
      ascending: false
    });

  if (
    statusFilter &&
    statusFilter !== "all"
  ) {
    query = query.eq(
      "status",
      statusFilter
    );
  }

  const {
    data: interests,
    error: interestError
  } = await query;

  if (interestError) {

    list.innerHTML = `
      <div class="feature-box">
        <h3>Interest requests load nahi hui</h3>
        <p>${interestError.message}</p>
      </div>
    `;

    return;
  }

  if (
    !interests ||
    interests.length === 0
  ) {

    list.innerHTML = `
      <div class="feature-box">
        <h3>No Interest Requests Found</h3>
      </div>
    `;

    return;
  }


  const profileIds = [
    ...new Set(
      interests.flatMap(item => [
        item.sender_id,
        item.receiver_id
      ])
    )
  ].filter(Boolean);


  const {
    data: profiles,
    error: profileError
  } = await client
    .from("profiles")
    .select(`
      id,
      full_name,
      email
    `)
    .in("id", profileIds);

  if (profileError) {

    list.innerHTML = `
      <div class="feature-box">
        <h3>User details load nahi hui</h3>
        <p>${profileError.message}</p>
      </div>
    `;

    return;
  }


  const profileMap = {};

  (profiles || []).forEach(profile => {

    profileMap[profile.id] = profile;

  });


  list.innerHTML = "";

  interests.forEach(item => {

    const sender =
      profileMap[item.sender_id];

    const receiver =
      profileMap[item.receiver_id];

    const createdDate =
      item.created_at
        ? new Date(
            item.created_at
          ).toLocaleString("en-IN")
        : "-";

    let statusColor = "#f59e0b";
    let statusText = "Pending";

    if (item.status === "accepted") {
      statusColor = "#16a34a";
      statusText = "Accepted";
    }

    if (item.status === "rejected") {
      statusColor = "#dc2626";
      statusText = "Rejected";
    }

    if (item.status === "cancelled") {
      statusColor = "#64748b";
      statusText = "Cancelled";
    }


    list.innerHTML += `

<div
  class="feature-box"
  style="
    border-radius:18px;
    padding:20px;
  ">

  <div style="
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:15px;
    flex-wrap:wrap;
    margin-bottom:18px;
  ">

    <h3 style="margin:0;">
      ❤️ Interest Request
    </h3>

    <span style="
      background:${statusColor};
      color:white;
      padding:6px 13px;
      border-radius:20px;
      font-size:12px;
      font-weight:bold;
    ">
      ${statusText}
    </span>

  </div>

  <hr style="
    margin:15px 0;
    opacity:.2;
  ">

  <p>
    <strong>Sender Name:</strong><br>
    ${sender?.full_name || "-"}
  </p>

  <p>
    <strong>Sender Email:</strong><br>
    ${sender?.email || "-"}
  </p>

  <p>
    <strong>Receiver Name:</strong><br>
    ${receiver?.full_name || "-"}
  </p>

  <p>
    <strong>Receiver Email:</strong><br>
    ${receiver?.email || "-"}
  </p>

  <p>
    <strong>Date:</strong><br>
    ${createdDate}
  </p>

  <button
    type="button"
    onclick="deleteAdminInterest('${item.id}')"
    style="
      width:100%;
      margin-top:15px;
      padding:12px;
      background:#dc2626;
      color:white;
      border:none;
      border-radius:10px;
      font-weight:bold;
      cursor:pointer;
    ">
    🗑 Delete Interest
  </button>

</div>

`;

  });

}


// ======================================
// DELETE INTEREST BY ADMIN
// ======================================

async function deleteAdminInterest(
  interestId
) {

  if (!interestId) {
    alert("Interest ID nahi mili.");
    return;
  }

  const confirmDelete = confirm(
    "Kya aap ye interest request delete karna chahte hain?"
  );

  if (!confirmDelete) return;

  const {
    data,
    error
  } = await client
    .from("interests")
    .delete()
    .eq("id", interestId)
    .select("id");

  if (error) {
    alert(
      "Interest delete nahi hua: " +
      error.message
    );
    return;
  }

  if (!data || data.length === 0) {
    alert(
      "Interest delete permission nahi mili."
    );
    return;
  }

  alert(
    "Interest Deleted Successfully ✅"
  );

  await loadAdminInterests("all");

  await loadAdminInterestCount();

}


// ======================================
// TOTAL INTEREST COUNT
// ======================================

async function loadAdminInterestCount() {

  const totalInterests =
    document.getElementById(
      "totalInterests"
    );

  if (!totalInterests) return;

  const {
    count,
    error
  } = await client
    .from("interests")
    .select("*", {
      count: "exact",
      head: true
    });

  if (error) {
    console.error(
      "Interest count error:",
      error.message
    );
    return;
  }

  totalInterests.textContent =
    count || 0;

}


// Initial load

if (
  (window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))
) {

  loadAdminInterests("all");

  loadAdminInterestCount();

}

// ======================================
// UNREAD NOTIFICATION COUNT
// ======================================

async function loadNotificationCount() {

  const countElement =
    document.getElementById("notificationCount");

  if (!countElement) return;

  const {
    data: { user },
    error: userError
  } = await client.auth.getUser();

  if (userError || !user) {

    countElement.textContent = "0";

    return;
  }

  const {
    count,
    error
  } = await client
    .from("notifications")
    .select("*", {
      count: "exact",
      head: true
    })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {

    console.error(
      "Notification count error:",
      error.message
    );

    countElement.textContent = "0";

    return;
  }

  countElement.textContent =
    String(count || 0);

}

loadNotificationCount();

// ======================================
// PROFESSIONAL NOTIFICATION SYSTEM
// ======================================

(function () {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop();

  if (currentPage !== "notifications.html") {
    return;
  }

  const notificationList =
    document.getElementById(
      "notificationList"
    );

  const notificationPageCount =
    document.getElementById(
      "notificationPageCount"
    );

  const markAllButton =
    document.getElementById(
      "markAllNotificationsRead"
    );

  let notificationUser = null;


  // --------------------------------------
  // SAFE HTML
  // --------------------------------------

  function escapeNotificationText(value) {

    const div =
      document.createElement("div");

    div.textContent =
      value || "";

    return div.innerHTML;

  }


  // --------------------------------------
  // NOTIFICATION TYPE
  // --------------------------------------

  function getNotificationDesign(
    title,
    message
  ) {

    const text =
      (
        String(title || "") +
        " " +
        String(message || "")
      ).toLowerCase();

    if (text.includes("interest")) {

      return {
        type: "interest",
        icon: "❤️"
      };

    }

    if (
      text.includes("message") ||
      text.includes("chat")
    ) {

      return {
        type: "message",
        icon: "💬"
      };

    }

    if (
      text.includes("membership") ||
      text.includes("premium") ||
      text.includes("payment")
    ) {

      return {
        type: "membership",
        icon: "👑"
      };

    }

    if (
      text.includes("accepted") ||
      text.includes("approved")
    ) {

      return {
        type: "accepted",
        icon: "✅"
      };

    }

    if (
      text.includes("rejected") ||
      text.includes("declined")
    ) {

      return {
        type: "rejected",
        icon: "❌"
      };

    }

    return {
      type: "general",
      icon: "🔔"
    };

  }


  // --------------------------------------
  // RELATIVE TIME
  // --------------------------------------

  function getNotificationTime(dateValue) {

    if (!dateValue) return "";

    const date =
      new Date(dateValue);

    const now =
      new Date();

    const seconds =
      Math.floor(
        (now.getTime() - date.getTime()) /
        1000
      );

    if (seconds < 60) {
      return "Just now";
    }

    const minutes =
      Math.floor(seconds / 60);

    if (minutes < 60) {
      return minutes +
        (minutes === 1
          ? " minute ago"
          : " minutes ago");
    }

    const hours =
      Math.floor(minutes / 60);

    if (hours < 24) {
      return hours +
        (hours === 1
          ? " hour ago"
          : " hours ago");
    }

    const days =
      Math.floor(hours / 24);

    if (days === 1) {
      return "Yesterday";
    }

    if (days < 7) {
      return days + " days ago";
    }

    return date.toLocaleString("en-IN");

  }


  // --------------------------------------
  // LOAD NOTIFICATIONS
  // --------------------------------------

  async function loadProfessionalNotifications() {

    if (!notificationList) return;

    notificationList.innerHTML = `
      <div class="notification-loading-card">
        <div class="admin-loader"></div>
        <p>Loading Notifications...</p>
      </div>
    `;

    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();

    if (userError || !user) {

      notificationList.innerHTML = `
        <div class="notification-empty-card">
          <span class="notification-empty-icon">
            🔐
          </span>

          <h3>Please Login</h3>

          <p>
            Notifications dekhne ke liye login karein.
          </p>
        </div>
      `;

      if (notificationPageCount) {
        notificationPageCount.textContent =
          "0";
      }

      return;
    }

    notificationUser = user;

    const {
      data: notifications,
      error
    } = await client
      .from("notifications")
      .select(`
        id,
        title,
        message,
        is_read,
        created_at
      `)
      .eq("user_id", user.id)
      .order(
        "created_at",
        {
          ascending: false
        }
      );

    if (error) {

      notificationList.innerHTML = `
        <div class="notification-empty-card">
          <span class="notification-empty-icon">
            ⚠️
          </span>

          <h3>
            Notifications load nahi hui
          </h3>

          <p>
            ${escapeNotificationText(
              error.message
            )}
          </p>
        </div>
      `;

      return;
    }

    const unreadCount =
      (notifications || [])
        .filter(item =>
          item.is_read !== true
        )
        .length;

    if (notificationPageCount) {
      notificationPageCount.textContent =
        String(unreadCount);
    }

    if (
      !notifications ||
      notifications.length === 0
    ) {

      notificationList.innerHTML = `
        <div class="notification-empty-card">
          <span class="notification-empty-icon">
            🔔
          </span>

          <h3>No Notifications</h3>

          <p>
            Abhi aapke account me koi notification nahi hai.
          </p>
        </div>
      `;

      if (markAllButton) {
        markAllButton.disabled = true;
      }

      return;
    }

    notificationList.innerHTML = "";

    notifications.forEach(item => {

      const design =
        getNotificationDesign(
          item.title,
          item.message
        );

      const card =
        document.createElement("article");

      card.className =
        "notification-card " +
        "type-" +
        design.type +
        (
          item.is_read === true
            ? ""
            : " unread"
        );

      const title =
        escapeNotificationText(
          item.title ||
          "Notification"
        );

      const message =
        escapeNotificationText(
          item.message || ""
        );

      const statusBadge =
        item.is_read === true
          ? `
            <span class="notification-read-badge">
              Read
            </span>
          `
          : `
            <span class="notification-unread-badge">
              New
            </span>
          `;

      card.innerHTML = `
        <div class="notification-card-icon">
          ${design.icon}
        </div>

        <div class="notification-card-content">

          <div class="notification-card-top">

            <h3>
              ${title}
            </h3>

            ${statusBadge}

          </div>

          <p>
            ${message}
          </p>

          <span class="notification-time">
            ${getNotificationTime(
              item.created_at
            )}
          </span>

        </div>
      `;

      notificationList.appendChild(card);

    });

    if (markAllButton) {

      markAllButton.disabled =
        unreadCount === 0;

    }

  }


  // --------------------------------------
  // MARK ALL AS READ
  // --------------------------------------

  async function markAllNotificationsRead() {

    if (!notificationUser) return;

    if (markAllButton) {
      markAllButton.disabled = true;
      markAllButton.textContent =
        "Updating...";
    }

    const { error } = await client
      .from("notifications")
      .update({
        is_read: true
      })
      .eq(
        "user_id",
        notificationUser.id
      )
      .eq("is_read", false);

    if (markAllButton) {
      markAllButton.textContent =
        "✅ Mark All as Read";
    }

    if (error) {

      alert(
        "Notifications update nahi hui: " +
        error.message
      );

      if (markAllButton) {
        markAllButton.disabled = false;
      }

      return;
    }

    await loadProfessionalNotifications();

  }


  if (markAllButton) {

    markAllButton.addEventListener(
      "click",
      markAllNotificationsRead
    );

  }

  loadProfessionalNotifications();

})();

// ======================================
// WHO VIEWED MY PROFILE
// ======================================

(function () {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop();

  if (currentPage !== "profile.html") {
    return;
  }

  const viewersList =
    document.getElementById(
      "profileViewersList"
    );

  const uniqueViewerCount =
    document.getElementById(
      "uniqueViewerCount"
    );

  if (!viewersList) return;


  function escapeViewerText(value) {

    const div =
      document.createElement("div");

    div.textContent =
      value || "";

    return div.innerHTML;

  }


  function viewerRelativeTime(dateValue) {

    if (!dateValue) return "";

    const date =
      new Date(dateValue);

    const now =
      new Date();

    const seconds =
      Math.floor(
        (now.getTime() - date.getTime()) /
        1000
      );

    if (seconds < 60) {
      return "Just now";
    }

    const minutes =
      Math.floor(seconds / 60);

    if (minutes < 60) {
      return minutes + " minutes ago";
    }

    const hours =
      Math.floor(minutes / 60);

    if (hours < 24) {
      return hours + " hours ago";
    }

    const days =
      Math.floor(hours / 24);

    if (days === 1) {
      return "Yesterday";
    }

    if (days < 7) {
      return days + " days ago";
    }

    return date.toLocaleString("en-IN");

  }


  async function loadProfileViewers() {

    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();

    if (userError || !user) {

      viewersList.innerHTML = `
        <div class="profile-viewers-empty">
          Please login first.
        </div>
      `;

      return;
    }

    const {
      data: viewRows,
      error: viewError
    } = await client
      .from("profile_views")
      .select(`
        viewer_id,
        viewed_at
      `)
      .eq(
        "viewed_profile_id",
        user.id
      )
      .order(
        "viewed_at",
        {
          ascending: false
        }
      );

    if (viewError) {

      viewersList.innerHTML = `
        <div class="profile-viewers-empty">
          ${escapeViewerText(
            viewError.message
          )}
        </div>
      `;

      return;
    }

    if (
      !viewRows ||
      viewRows.length === 0
    ) {

      if (uniqueViewerCount) {
        uniqueViewerCount.textContent =
          "0";
      }

      viewersList.innerHTML = `
        <div class="profile-viewers-empty">

          <div style="font-size:50px;">
            👀
          </div>

          <h3>No Profile Visitors Yet</h3>

          <p>
            Jab koi member aapki profile dekhega,
            uski details yahan dikhengi.
          </p>

        </div>
      `;

      return;
    }


    const latestViewByUser = {};

    viewRows.forEach(row => {

      if (
        !latestViewByUser[row.viewer_id]
      ) {

        latestViewByUser[row.viewer_id] =
          row.viewed_at;

      }

    });


    const viewerIds =
      Object.keys(latestViewByUser);

    if (uniqueViewerCount) {
      uniqueViewerCount.textContent =
        String(viewerIds.length);
    }


    const {
      data: profiles,
      error: profileError
    } = await client
      .from("profiles")
      .select(`
        id,
        full_name,
        profile_photo,
        age,
        gender,
        state,
        district,
        membership_plan,
        verified,
        blocked
      `)
      .in(
        "id",
        viewerIds
      );

    if (profileError) {

      viewersList.innerHTML = `
        <div class="profile-viewers-empty">
          ${escapeViewerText(
            profileError.message
          )}
        </div>
      `;

      return;
    }


    const profileMap = {};

    (profiles || []).forEach(profile => {

      profileMap[profile.id] =
        profile;

    });


    viewersList.innerHTML = "";

    viewerIds.forEach(viewerId => {

      const profile =
        profileMap[viewerId];

      if (
        !profile ||
        profile.blocked === true
      ) {
        return;
      }

      const name =
        escapeViewerText(
          profile.full_name ||
          "DivyangSathi Member"
        );

      const firstLetter =
        name
          .charAt(0)
          .toUpperCase();

      const photoHtml =
        profile.profile_photo
          ? `
            <img
              class="profile-viewer-photo"
              src="${profile.profile_photo}"
              alt="Profile Photo">
          `
          : `
            <div class="profile-viewer-placeholder">
              ${firstLetter}
            </div>
          `;

      const membership =
        profile.membership_plan ||
        "Free";

      const verified =
        profile.verified === true
          ? "✅ Verified"
          : "⏳ Pending";

      const card =
        document.createElement("article");

      card.className =
        "profile-viewer-card";

      card.innerHTML = `
        <div class="profile-viewer-card-top">

          ${photoHtml}

          <div>

            <h3>
              ${name}
            </h3>

            <small>
              ${verified}
            </small>

          </div>

        </div>

        <p>
          <strong>Age:</strong>
          ${profile.age || "-"}
        </p>

        <p>
          <strong>Gender:</strong>
          ${escapeViewerText(
            profile.gender || "-"
          )}
        </p>

        <p>
          <strong>Location:</strong>
          ${escapeViewerText(
            profile.district || "-"
          )},
          ${escapeViewerText(
            profile.state || "-"
          )}
        </p>

        <p>
          <strong>Membership:</strong>
          ${escapeViewerText(
            membership
          )}
        </p>

        <span class="profile-viewer-time">
          Viewed ${viewerRelativeTime(
            latestViewByUser[viewerId]
          )}
        </span>

        <a
          class="profile-viewer-button"
          href="view-profile.html?id=${encodeURIComponent(
            viewerId
          )}">
          👤 View Profile
        </a>
      `;

      viewersList.appendChild(card);

    });


    if (
      viewersList.children.length === 0
    ) {

      viewersList.innerHTML = `
        <div class="profile-viewers-empty">
          No available profile visitors.
        </div>
      `;

    }

  }


  loadProfileViewers();

})();

// ======================================
// FAVOURITE / SHORTLIST SYSTEM
// ======================================

(function () {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop();

  if (currentPage !== "view-profile.html") {
    return;
  }

  const favouriteButton =
    document.getElementById(
      "favouriteButton"
    );

  if (!favouriteButton) return;

  const params =
    new URLSearchParams(
      window.location.search
    );

  const profileId =
    params.get("id");

  let loggedInFavouriteUser = null;
  let currentFavouriteId = null;


  // ======================================
  // INITIAL LOAD
  // ======================================

  async function initializeFavouriteButton() {

    if (!profileId) {

      favouriteButton.disabled = true;

      favouriteButton.textContent =
        "Profile ID Missing";

      return;

    }

    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();

    if (userError || !user) {

      favouriteButton.textContent =
        "⭐ Login to Favourite";

      favouriteButton.onclick =
        function () {

          window.location.href =
            "login.html";

        };

      return;

    }

    loggedInFavouriteUser = user;

    if (user.id === profileId) {

      favouriteButton.disabled = true;

      favouriteButton.textContent =
        "Apni Profile Favourite Nahi Kar Sakte";

      return;

    }

    await checkFavouriteStatus();

  }


  // ======================================
  // CHECK FAVOURITE STATUS
  // ======================================

  async function checkFavouriteStatus() {

    const {
      data,
      error
    } = await client
      .from("favourites")
      .select("id")
      .eq(
        "user_id",
        loggedInFavouriteUser.id
      )
      .eq(
        "favourite_profile_id",
        profileId
      )
      .maybeSingle();

    if (error) {

      console.error(
        "Favourite status error:",
        error.message
      );

      favouriteButton.textContent =
        "⭐ Favourite";

      return;

    }

    if (data) {

      currentFavouriteId = data.id;

      favouriteButton.textContent =
        "★ Remove Favourite";

      favouriteButton.classList.add(
        "favourite-active"
      );

    } else {

      currentFavouriteId = null;

      favouriteButton.textContent =
        "☆ Add to Favourite";

      favouriteButton.classList.remove(
        "favourite-active"
      );

    }

  }


  // ======================================
  // ADD FAVOURITE
  // ======================================

  async function addFavourite() {

    favouriteButton.disabled = true;

    const {
      data,
      error
    } = await client
      .from("favourites")
      .insert([
        {
          user_id:
            loggedInFavouriteUser.id,

          favourite_profile_id:
            profileId
        }
      ])
      .select("id")
      .maybeSingle();

    favouriteButton.disabled = false;

    if (error) {

      if (
        String(error.message)
          .toLowerCase()
          .includes("duplicate")
      ) {

        await checkFavouriteStatus();

        alert(
          "Profile already Favourite me hai."
        );

        return;

      }

      alert(
        "Favourite add nahi hua: " +
        error.message
      );

      return;

    }

    currentFavouriteId =
      data?.id || null;

    favouriteButton.textContent =
      "★ Remove Favourite";

    favouriteButton.classList.add(
      "favourite-active"
    );

    alert(
      "⭐ Profile Favourite me add ho gayi."
    );

  }


  // ======================================
  // REMOVE FAVOURITE
  // ======================================

  async function removeFavourite() {

    favouriteButton.disabled = true;

    const query =
      client
        .from("favourites")
        .delete()
        .eq(
          "user_id",
          loggedInFavouriteUser.id
        )
        .eq(
          "favourite_profile_id",
          profileId
        );

    const {
      data,
      error
    } = await query.select("id");

    favouriteButton.disabled = false;

    if (error) {

      alert(
        "Favourite remove nahi hua: " +
        error.message
      );

      return;

    }

    if (!data || data.length === 0) {

      alert(
        "Favourite record nahi mila."
      );

      await checkFavouriteStatus();

      return;

    }

    currentFavouriteId = null;

    favouriteButton.textContent =
      "☆ Add to Favourite";

    favouriteButton.classList.remove(
      "favourite-active"
    );

    alert(
      "Profile Favourite se remove ho gayi."
    );

  }


  // ======================================
  // BUTTON CLICK
  // ======================================

  favouriteButton.addEventListener(
    "click",
    async function () {

      if (!loggedInFavouriteUser) {

        window.location.href =
          "login.html";

        return;

      }

      if (currentFavouriteId) {

        await removeFavourite();

      } else {

        await addFavourite();

      }

    }
  );


  initializeFavouriteButton();

})();

// ======================================
// MY FAVOURITES PAGE - PART 1
// LOAD FAVOURITE PROFILES
// ======================================

(function () {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop();

  if (currentPage !== "favourites.html") {
    return;
  }

  const favouritesList =
    document.getElementById(
      "favouritesList"
    );

  const favouritesPageCount =
    document.getElementById(
      "favouritesPageCount"
    );

  if (!favouritesList) {
    return;
  }


  // ======================================
  // SAFE TEXT
  // ======================================

  function escapeFavouriteText(value) {

    const element =
      document.createElement("div");

    element.textContent =
      value || "";

    return element.innerHTML;

  }


  // ======================================
  // LOAD FAVOURITES
  // ======================================

  async function loadFavouriteProfiles() {

    favouritesList.innerHTML = `
      <div class="favourites-loading-card">

        <div class="admin-loader"></div>

        <p>
          Loading Favourite Profiles...
        </p>

      </div>
    `;


    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();


    if (userError || !user) {

      favouritesList.innerHTML = `
        <div class="favourites-empty-card">

          <span class="favourites-empty-icon">
            🔐
          </span>

          <h3>
            Please Login
          </h3>

          <p>
            Favourite profiles dekhne ke liye login karein.
          </p>

          <a
            href="login.html"
            class="favourites-search-button">

            Login Now

          </a>

        </div>
      `;

      if (favouritesPageCount) {
        favouritesPageCount.textContent =
          "0";
      }

      return;

    }


    const {
      data: favouriteRows,
      error: favouriteError
    } = await client
      .from("favourites")
      .select(`
        id,
        favourite_profile_id,
        created_at
      `)
      .eq(
        "user_id",
        user.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


    if (favouriteError) {

      favouritesList.innerHTML = `
        <div class="favourites-empty-card">

          <span class="favourites-empty-icon">
            ⚠️
          </span>

          <h3>
            Favourites load nahi hue
          </h3>

          <p>
            ${escapeFavouriteText(
              favouriteError.message
            )}
          </p>

        </div>
      `;

      return;

    }


    if (
      !favouriteRows ||
      favouriteRows.length === 0
    ) {

      favouritesList.innerHTML = `
        <div class="favourites-empty-card">

          <span class="favourites-empty-icon">
            ⭐
          </span>

          <h3>
            No Favourite Profiles
          </h3>

          <p>
            Search profiles karke suitable members ko shortlist karein.
          </p>

          <a
            href="search.html"
            class="favourites-search-button">

            🔍 Search Profiles

          </a>

        </div>
      `;

      if (favouritesPageCount) {
        favouritesPageCount.textContent =
          "0";
      }

      return;

    }


    const favouriteProfileIds = [
      ...new Set(
        favouriteRows
          .map(
            item =>
              item.favourite_profile_id
          )
          .filter(Boolean)
      )
    ];


    const {
      data: profiles,
      error: profileError
    } = await client
      .from("profiles")
      .select(`
        id,
        full_name,
        profile_photo,
        age,
        gender,
        disability_type,
        education,
        occupation,
        state,
        district,
        membership_plan,
        verified,
        blocked
      `)
      .in(
        "id",
        favouriteProfileIds
      );


    if (profileError) {

      favouritesList.innerHTML = `
        <div class="favourites-empty-card">

          <span class="favourites-empty-icon">
            ⚠️
          </span>

          <h3>
            Profile details load nahi hui
          </h3>

          <p>
            ${escapeFavouriteText(
              profileError.message
            )}
          </p>

        </div>
      `;

      return;

    }


    const profileMap = {};

    (profiles || []).forEach(profile => {

      profileMap[profile.id] =
        profile;

    });


    const availableFavourites =
      favouriteRows.filter(item => {

        const profile =
          profileMap[
            item.favourite_profile_id
          ];

        return (
          profile &&
          profile.blocked !== true
        );

      });


    if (favouritesPageCount) {

      favouritesPageCount.textContent =
        String(
          availableFavourites.length
        );

    }


    if (
      availableFavourites.length === 0
    ) {

      favouritesList.innerHTML = `
        <div class="favourites-empty-card">

          <span class="favourites-empty-icon">
            ⭐
          </span>

          <h3>
            No Available Favourite Profiles
          </h3>

          <p>
            Aapke saved profiles abhi available nahi hain.
          </p>

        </div>
      `;

      return;

    }


    favouritesList.innerHTML = "";


    availableFavourites.forEach(item => {

      const profile =
        profileMap[
          item.favourite_profile_id
        ];

      const safeName =
        escapeFavouriteText(
          profile.full_name ||
          "DivyangSathi Member"
        );

      const firstLetter =
        safeName
          .charAt(0)
          .toUpperCase();

      const photoHtml =
        profile.profile_photo
          ? `
            <img
              src="${profile.profile_photo}"
              alt="Profile Photo"
              class="favourite-profile-photo">
          `
          : `
            <div class="favourite-profile-placeholder">
              ${firstLetter}
            </div>
          `;

      const membershipPlan =
        escapeFavouriteText(
          profile.membership_plan ||
          "Free"
        );

      const verificationText =
        profile.verified === true
          ? "✅ Verified"
          : "⏳ Pending";

      const card =
        document.createElement(
          "article"
        );

      card.className =
        "favourite-profile-card";

      card.innerHTML = `

        <div class="favourite-profile-photo-wrapper">

          ${photoHtml}

          <span class="favourite-profile-badge">
            ⭐ Favourite
          </span>

        </div>


        <div class="favourite-profile-content">

          <h3>
            ${safeName}
          </h3>


          <div class="favourite-profile-info">

            <p>
              <strong>🎂 Age</strong><br>
              ${profile.age || "-"}
            </p>

            <p>
              <strong>⚧ Gender</strong><br>
              ${escapeFavouriteText(
                profile.gender || "-"
              )}
            </p>

            <p>
              <strong>📍 Location</strong><br>
              ${escapeFavouriteText(
                profile.district || "-"
              )},
              ${escapeFavouriteText(
                profile.state || "-"
              )}
            </p>

            <p>
              <strong>♿ Disability</strong><br>
              ${escapeFavouriteText(
                profile.disability_type ||
                "-"
              )}
            </p>

            <p>
              <strong>🎓 Education</strong><br>
              ${escapeFavouriteText(
                profile.education || "-"
              )}
            </p>

            <p>
              <strong>💎 Membership</strong><br>
              ${membershipPlan}
            </p>

          </div>


          <p style="
            margin:0 0 16px;
            color:#64748b;
            font-size:13px;
          ">

            ${verificationText}

          </p>


          <div class="favourite-profile-actions">

            <a
              href="view-profile.html?id=${encodeURIComponent(
                profile.id
              )}"
              class="favourite-view-button">

              👤 View Profile

            </a>


            <button
              type="button"
              class="favourite-remove-button"
              data-favourite-id="${item.id}">

              🗑 Remove

            </button>

          </div>

        </div>
      `;

      favouritesList.appendChild(card);

    });

  }


  // Part 2 is function ko use karega
  window.loadFavouriteProfiles =
    loadFavouriteProfiles;


  loadFavouriteProfiles();

})();

// ======================================
// MY FAVOURITES PAGE - PART 2
// REMOVE FAVOURITE
// ======================================

(function () {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop();

  if (currentPage !== "favourites.html") {
    return;
  }

  const favouritesList =
    document.getElementById(
      "favouritesList"
    );

  if (!favouritesList) {
    return;
  }


  async function removeFavouriteFromPage(
    favouriteId
  ) {

    if (!favouriteId) {

      alert(
        "Favourite ID nahi mili."
      );

      return;

    }

    const confirmRemove =
      confirm(
        "Kya aap is profile ko Favourite se remove karna chahte hain?"
      );

    if (!confirmRemove) {
      return;
    }


    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();


    if (userError || !user) {

      alert(
        "Please login first."
      );

      window.location.href =
        "login.html";

      return;

    }


    const {
      data,
      error
    } = await client
      .from("favourites")
      .delete()
      .eq(
        "id",
        favouriteId
      )
      .eq(
        "user_id",
        user.id
      )
      .select("id");


    if (error) {

      alert(
        "Favourite remove nahi hua: " +
        error.message
      );

      return;

    }


    if (
      !data ||
      data.length === 0
    ) {

      alert(
        "Favourite record nahi mila ya remove permission nahi hai."
      );

      return;

    }


    alert(
      "Profile Favourite se remove ho gayi."
    );


    if (
      typeof window.loadFavouriteProfiles ===
      "function"
    ) {

      await window
        .loadFavouriteProfiles();

    }

  }


  favouritesList.addEventListener(
    "click",
    async function (event) {

      const removeButton =
        event.target.closest(
          ".favourite-remove-button"
        );

      if (!removeButton) {
        return;
      }

      const favouriteId =
        removeButton.getAttribute(
          "data-favourite-id"
        );

      removeButton.disabled = true;

      removeButton.textContent =
        "Removing...";

      await removeFavouriteFromPage(
        favouriteId
      );

      removeButton.disabled = false;

      removeButton.textContent =
        "🗑 Remove";

    }
  );

})();

// ======================================
// RECOMMENDED MATCHES - PART 1
// ======================================

(function () {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop();

  if (currentPage !== "matches.html") {
    return;
  }

  const matchesList =
    document.getElementById(
      "recommendedMatchesList"
    );

  const matchCount =
    document.getElementById(
      "recommendedMatchCount"
    );

  if (!matchesList) return;


  function safeText(value) {

    const div =
      document.createElement("div");

    div.textContent =
      value || "";

    return div.innerHTML;

  }


  async function loadRecommendedMatches() {

    matchesList.innerHTML = `
      <div class="matches-loading-card">

        <div class="admin-loader"></div>

        <p>
          Finding suitable matches...
        </p>

      </div>
    `;


    const {
      data: { user }
    } = await client.auth.getUser();

    if (!user) {

      matchesList.innerHTML = `
        <div class="matches-empty-card">

          <h3>
            Please login first.
          </h3>

        </div>
      `;

      return;

    }


    const {
      data,
      error
    } = await client.rpc(
      "get_recommended_matches",
      {
        match_limit: 20
      }
    );

    if (error) {

      matchesList.innerHTML = `
        <div class="matches-empty-card">

          <h3>
            ${safeText(error.message)}
          </h3>

        </div>
      `;

      return;

    }


    if (!data || data.length === 0) {

      if (matchCount) {
        matchCount.textContent = "0";
      }

      matchesList.innerHTML = `
        <div class="matches-empty-card">

          <h3>
            No recommended matches found.
          </h3>

        </div>
      `;

      return;

    }


    if (matchCount) {
      matchCount.textContent =
        String(data.length);
    }

    matchesList.innerHTML = "";


    data.forEach(profile => {

      const photo =
        profile.profile_photo

          ? `<img
               src="${profile.profile_photo}"
               class="match-profile-photo">`

          : `<div
               class="match-profile-placeholder">

               ${(profile.full_name || "D")
                 .charAt(0)
                 .toUpperCase()}

             </div>`;

      const verified =
        profile.verified

          ? "✅ Verified"

          : "⏳ Pending";


      matchesList.innerHTML += `

      <article class="match-profile-card">

        <div class="match-profile-photo-wrapper">

          ${photo}

          <span class="match-membership-badge">

            ${safeText(
              profile.membership_plan ||
              "Free"
            )}

          </span>

          <span class="match-score-badge">

            ${profile.match_score}% Match

          </span>

        </div>


        <div class="match-profile-content">

          <h3>

            ${safeText(profile.full_name)}

          </h3>

          <span class="match-verification-text">

            ${verified}

          </span>


          <div class="match-profile-info">

            <p>

              <strong>🎂 Age</strong><br>

              ${profile.age || "-"}

            </p>

            <p>

              <strong>⚧ Gender</strong><br>

              ${safeText(profile.gender)}

            </p>

            <p>

              <strong>📍 State</strong><br>

              ${safeText(profile.state)}

            </p>

            <p>

              <strong>♿ Disability</strong><br>

              ${safeText(profile.disability_type)}

            </p>

          </div>


          <div class="match-profile-actions">

            <a
              href="view-profile.html?id=${profile.id}"
              class="match-view-button">

              👤 View Profile

            </a>

            <button
              class="match-interest-button"
              data-id="${profile.id}">

              ❤️ Interest

            </button>

          </div>

        </div>

      </article>

      `;

    });

  }


  window.loadRecommendedMatches =
    loadRecommendedMatches;

  loadRecommendedMatches();

})();

// ======================================
// RECOMMENDED MATCHES - PART 2
// INTEREST BUTTON
// ======================================

(function () {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop();

  if (currentPage !== "matches.html") {
    return;
  }

  const matchesList =
    document.getElementById(
      "recommendedMatchesList"
    );

  if (!matchesList) {
    return;
  }


  matchesList.addEventListener(
    "click",
    async function (event) {

      const interestButton =
        event.target.closest(
          ".match-interest-button"
        );

      if (!interestButton) {
        return;
      }

      const profileId =
        interestButton.getAttribute(
          "data-id"
        );

      if (!profileId) {

        alert(
          "Profile ID nahi mili."
        );

        return;
      }


      if (
        typeof sendInterest !==
        "function"
      ) {

        alert(
          "Interest function available nahi hai."
        );

        return;
      }


      interestButton.disabled = true;

      const oldButtonText =
        interestButton.textContent;

      interestButton.textContent =
        "Sending...";


      try {

        await sendInterest(
          profileId
        );

      } catch (error) {

        console.error(
          "Recommended interest error:",
          error
        );

        alert(
          "Interest send karte waqt error aaya."
        );

      } finally {

        interestButton.disabled =
          false;

        interestButton.textContent =
          oldButtonText;

      }

    }
  );

})();

// ======================================
// VIEW PROFILE ONLINE STATUS
// ======================================

(function () {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop();

  if (currentPage !== "view-profile.html") {
    return;
  }

  const onlineStatusElement =
    document.getElementById(
      "viewOnlineStatus"
    );

  const lastSeenElement =
    document.getElementById(
      "viewLastSeen"
    );

  if (
    !onlineStatusElement ||
    !lastSeenElement
  ) {
    return;
  }

  const params =
    new URLSearchParams(
      window.location.search
    );

  const profileId =
    params.get("id");

  if (!profileId) return;


  function formatLastSeen(dateValue) {

    if (!dateValue) {
      return "Last seen unavailable";
    }

    const lastSeenDate =
      new Date(dateValue);

    const now =
      new Date();

    const seconds =
      Math.floor(
        (
          now.getTime() -
          lastSeenDate.getTime()
        ) / 1000
      );

    if (seconds < 60) {
      return "Last seen just now";
    }

    const minutes =
      Math.floor(seconds / 60);

    if (minutes < 60) {
      return `Last seen ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }

    const hours =
      Math.floor(minutes / 60);

    if (hours < 24) {
      return `Last seen ${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    const days =
      Math.floor(hours / 24);

    if (days === 1) {
      return "Last seen yesterday";
    }

    if (days < 7) {
      return `Last seen ${days} days ago`;
    }

    return (
      "Last seen " +
      lastSeenDate.toLocaleString(
        "en-IN"
      )
    );

  }


  async function loadProfileOnlineStatus() {

    const {
      data: profile,
      error
    } = await client
      .from("profiles")
      .select(
        "is_online, last_seen"
      )
      .eq("id", profileId)
      .maybeSingle();

    if (error || !profile) {

      console.error(
        "Online status load error:",
        error?.message
      );

      onlineStatusElement.textContent =
        "⚫ Offline";

      onlineStatusElement.className =
        "view-profile-online-status offline";

      lastSeenElement.textContent =
        "Last seen unavailable";

      return;
    }

    if (profile.is_online === true) {

      onlineStatusElement.textContent =
        "🟢 Online";

      onlineStatusElement.className =
        "view-profile-online-status online";

      lastSeenElement.textContent =
        "Active now";

    } else {

      onlineStatusElement.textContent =
        "⚫ Offline";

      onlineStatusElement.className =
        "view-profile-online-status offline";

      lastSeenElement.textContent =
        formatLastSeen(
          profile.last_seen
        );

    }

  }


  loadProfileOnlineStatus();

  setInterval(
    loadProfileOnlineStatus,
    30000
  );

})();

// ======================================
// REPORT & PERSONAL BLOCK SYSTEM
// ======================================

(function () {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop();

  if (currentPage !== "view-profile.html") {
    return;
  }

  const reportButton =
    document.getElementById(
      "reportUserButton"
    );

  const blockButton =
    document.getElementById(
      "blockUserButton"
    );

  if (!reportButton || !blockButton) {
    return;
  }

  const params =
    new URLSearchParams(
      window.location.search
    );

  const targetUserId =
    params.get("id");

  let loggedInSafetyUser = null;
  let currentBlockId = null;


  // ======================================
  // INITIALIZE
  // ======================================

  async function initializeReportBlockSystem() {

    if (!targetUserId) {

      reportButton.disabled = true;
      blockButton.disabled = true;

      return;

    }

    const {
      data: { user },
      error
    } = await client.auth.getUser();

    if (error || !user) {

      reportButton.textContent =
        "🚩 Login to Report";

      blockButton.textContent =
        "🚫 Login to Block";

      return;

    }

    loggedInSafetyUser = user;

    if (user.id === targetUserId) {

      reportButton.disabled = true;
      blockButton.disabled = true;

      return;

    }

    await checkPersonalBlockStatus();

  }


  // ======================================
  // CHECK BLOCK STATUS
  // ======================================

  async function checkPersonalBlockStatus() {

    const {
      data,
      error
    } = await client
      .from("user_blocks")
      .select("id")
      .eq(
        "blocker_id",
        loggedInSafetyUser.id
      )
      .eq(
        "blocked_user_id",
        targetUserId
      )
      .maybeSingle();

    if (error) {

      console.error(
        "Block status error:",
        error.message
      );

      return;

    }

    if (data) {

      currentBlockId = data.id;

      blockButton.textContent =
        "🔓 Unblock User";

      blockButton.classList.add(
        "block-active"
      );

    } else {

      currentBlockId = null;

      blockButton.textContent =
        "🚫 Block User";

      blockButton.classList.remove(
        "block-active"
      );

    }

  }


  // ======================================
  // REPORT USER
  // ======================================

  async function reportUser() {

    if (!loggedInSafetyUser) {

      window.location.href =
        "login.html";

      return;

    }

    const reason =
      prompt(
        "Report reason likhein:\n\nFake Profile\nAbuse\nSpam\nInappropriate Content\nOther"
      );

    if (!reason) {
      return;
    }

    const details =
      prompt(
        "Additional details likhein (optional):"
      ) || "";

    reportButton.disabled = true;
    reportButton.textContent =
      "Submitting...";

    const {
      error
    } = await client
      .from("user_reports")
      .insert([
        {
          reporter_id:
            loggedInSafetyUser.id,

          reported_user_id:
            targetUserId,

          reason:
            reason.trim(),

          details:
            details.trim(),

          status:
            "pending"
        }
      ]);

    reportButton.disabled = false;
    reportButton.textContent =
      "🚩 Report User";

    if (error) {

      alert(
        "Report submit nahi hui: " +
        error.message
      );

      return;

    }

    alert(
      "Report successfully submit ho gayi. Admin review karega."
    );

  }


  // ======================================
  // BLOCK USER
  // ======================================

  async function blockUser() {

    if (!loggedInSafetyUser) {

      window.location.href =
        "login.html";

      return;

    }

    const confirmed =
      confirm(
        "Is user ko block karne ke baad aap dono chat aur interest use nahi kar payenge. Continue?"
      );

    if (!confirmed) {
      return;
    }

    blockButton.disabled = true;
    blockButton.textContent =
      "Blocking...";

    const {
      data,
      error
    } = await client
      .from("user_blocks")
      .insert([
        {
          blocker_id:
            loggedInSafetyUser.id,

          blocked_user_id:
            targetUserId
        }
      ])
      .select("id")
      .maybeSingle();

    blockButton.disabled = false;

    if (error) {

      if (
        String(error.message)
          .toLowerCase()
          .includes("duplicate")
      ) {

        await checkPersonalBlockStatus();

        return;

      }

      blockButton.textContent =
        "🚫 Block User";

      alert(
        "User block nahi hua: " +
        error.message
      );

      return;

    }

    currentBlockId =
      data?.id || null;

    blockButton.textContent =
      "🔓 Unblock User";

    blockButton.classList.add(
      "block-active"
    );

    disableProfileInteractions();

    alert(
      "User successfully blocked."
    );

  }


  // ======================================
  // UNBLOCK USER
  // ======================================

  async function unblockUser() {

    if (!loggedInSafetyUser) {
      return;
    }

    const confirmed =
      confirm(
        "Kya aap is user ko unblock karna chahte hain?"
      );

    if (!confirmed) {
      return;
    }

    blockButton.disabled = true;
    blockButton.textContent =
      "Unblocking...";

    const {
      error
    } = await client
      .from("user_blocks")
      .delete()
      .eq(
        "blocker_id",
        loggedInSafetyUser.id
      )
      .eq(
        "blocked_user_id",
        targetUserId
      );

    blockButton.disabled = false;

    if (error) {

      alert(
        "User unblock nahi hua: " +
        error.message
      );

      return;

    }

    currentBlockId = null;

    blockButton.textContent =
      "🚫 Block User";

    blockButton.classList.remove(
      "block-active"
    );

    enableProfileInteractions();

    alert(
      "User successfully unblocked."
    );

  }


  // ======================================
  // DISABLE INTERACTIONS
  // ======================================

  function disableProfileInteractions() {

    const interestButton =
      document.getElementById(
        "interestButton"
      );

    const chatButton =
      document.getElementById(
        "chatButton"
      );

    const favouriteButton =
      document.getElementById(
        "favouriteButton"
      );

    if (interestButton) {

      interestButton.disabled = true;

      interestButton.textContent =
        "🚫 Interest Disabled";

    }

    if (chatButton) {

      chatButton.disabled = true;

      chatButton.textContent =
        "🚫 Chat Disabled";

    }

    if (favouriteButton) {

      favouriteButton.disabled = true;

    }

  }


  // ======================================
  // ENABLE INTERACTIONS
  // ======================================

  function enableProfileInteractions() {

    const interestButton =
      document.getElementById(
        "interestButton"
      );

    const chatButton =
      document.getElementById(
        "chatButton"
      );

    const favouriteButton =
      document.getElementById(
        "favouriteButton"
      );

    if (interestButton) {

      interestButton.disabled = false;

      interestButton.textContent =
        "❤️ Send Interest";

    }

    if (chatButton) {

      chatButton.disabled = false;

      chatButton.textContent =
        "💬 Start Chat";

    }

    if (favouriteButton) {

      favouriteButton.disabled = false;

    }

  }


  // ======================================
  // EVENTS
  // ======================================

  reportButton.addEventListener(
    "click",
    reportUser
  );

  blockButton.addEventListener(
    "click",
    async function () {

      if (currentBlockId) {

        await unblockUser();

      } else {

        await blockUser();

      }

    }
  );


  initializeReportBlockSystem()
    .then(function () {

      if (currentBlockId) {

        disableProfileInteractions();

      }

    });

})();

// ======================================
// ADMIN REPORTS MANAGEMENT - PART 1
// LOAD REPORTS + FILTERS
// ======================================

(function () {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop();

  if (!currentPage.startsWith("admin") || currentPage === "admin-login.html") {
    return;
  }

  const reportsContainer =
    document.getElementById(
      "adminReportsList"
    );

  if (!reportsContainer) {
    return;
  }

  let currentReportFilter =
    "pending";


  // ======================================
  // SAFE TEXT
  // ======================================

  function escapeAdminReportText(value) {

    const element =
      document.createElement("div");

    element.textContent =
      value || "";

    return element.innerHTML;

  }


  // ======================================
  // DATE FORMAT
  // ======================================

  function formatAdminReportDate(
    dateValue
  ) {

    if (!dateValue) {
      return "-";
    }

    return new Date(
      dateValue
    ).toLocaleString(
      "en-IN"
    );

  }


  // ======================================
  // LOAD ADMIN REPORTS
  // ======================================

  async function loadAdminReports(
    status = "pending"
  ) {

    currentReportFilter =
      status || "pending";

    reportsContainer.innerHTML = `
      <div class="admin-loading-card">

        <div class="admin-loader"></div>

        <p>
          Loading User Reports...
        </p>

      </div>
    `;


    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();


    if (userError || !user) {

      reportsContainer.innerHTML = `
        <div class="admin-report-empty">

          <h3>
            Admin Login Required
          </h3>

          <p>
            Reports dekhne ke liye admin login karein.
          </p>

        </div>
      `;

      return;

    }


    const {
      data: admin,
      error: adminError
    } = await client
      .from("admins")
      .select("id, active")
      .eq("id", user.id)
      .maybeSingle();


    if (
      adminError ||
      !admin ||
      admin.active !== true
    ) {

      reportsContainer.innerHTML = `
        <div class="admin-report-empty">

          <h3>
            Access Denied
          </h3>

          <p>
            Sirf active administrator reports dekh sakta hai.
          </p>

        </div>
      `;

      return;

    }


    let reportsQuery =
      client
        .from("user_reports")
        .select(`
          id,
          reporter_id,
          reported_user_id,
          reason,
          details,
          status,
          created_at,
          reviewed_at,
          reviewed_by
        `)
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (
      currentReportFilter !== "all"
    ) {

      reportsQuery =
        reportsQuery.eq(
          "status",
          currentReportFilter
        );

    }


    const {
      data: reports,
      error: reportsError
    } = await reportsQuery;


    if (reportsError) {

      reportsContainer.innerHTML = `
        <div class="admin-report-empty">

          <h3>
            Reports load nahi hui
          </h3>

          <p>
            ${escapeAdminReportText(
              reportsError.message
            )}
          </p>

        </div>
      `;

      return;

    }


    if (
      !reports ||
      reports.length === 0
    ) {

      reportsContainer.innerHTML = `
        <div class="admin-report-empty">

          <h3>
            No ${
              currentReportFilter === "all"
                ? ""
                : escapeAdminReportText(
                    currentReportFilter
                  )
            } Reports
          </h3>

          <p>
            Is filter me abhi koi report available nahi hai.
          </p>

        </div>
      `;

      return;

    }


    const userIds = [
      ...new Set(
        reports
          .flatMap(report => [
            report.reporter_id,
            report.reported_user_id
          ])
          .filter(Boolean)
      )
    ];


    const {
      data: profiles,
      error: profileError
    } = await client
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        mobile,
        profile_photo,
        blocked,
        verified,
        membership_plan
      `)
      .in(
        "id",
        userIds
      );


    if (profileError) {

      reportsContainer.innerHTML = `
        <div class="admin-report-empty">

          <h3>
            User profiles load nahi hui
          </h3>

          <p>
            ${escapeAdminReportText(
              profileError.message
            )}
          </p>

        </div>
      `;

      return;

    }


    const profileMap = {};

    (profiles || []).forEach(profile => {

      profileMap[profile.id] =
        profile;

    });


    reportsContainer.innerHTML = "";

    reports.forEach(report => {

      const reporter =
        profileMap[
          report.reporter_id
        ];

      const reportedUser =
        profileMap[
          report.reported_user_id
        ];


      const reporterName =
        escapeAdminReportText(
          reporter?.full_name ||
          "Unknown Reporter"
        );

      const reportedName =
        escapeAdminReportText(
          reportedUser?.full_name ||
          "Unknown User"
        );

      const reportedInitial =
        reportedName
          .charAt(0)
          .toUpperCase();


      const statusClass =
        escapeAdminReportText(
          report.status ||
          "pending"
        );


      const card =
        document.createElement(
          "article"
        );

      card.className =
        "admin-report-card " +
        "status-" +
        statusClass;


      card.innerHTML = `
        <div class="admin-report-card-header">

          <div class="admin-report-card-title">

            <div class="admin-report-avatar">
              ${reportedInitial}
            </div>

            <div>

              <h3>
                Report Against:
                ${reportedName}
              </h3>

              <small>
                Report ID:
                ${escapeAdminReportText(
                  report.id
                )}
              </small>

            </div>

          </div>


          <span
            class="admin-report-status
            ${statusClass}">

            ${statusClass}

          </span>

        </div>


        <div class="admin-report-section">

          <strong>
            🚩 Reason
          </strong>

          <p>
            ${escapeAdminReportText(
              report.reason ||
              "No reason provided"
            )}
          </p>

        </div>


        <div class="admin-report-section">

          <strong>
            📝 Additional Details
          </strong>

          <p>
            ${escapeAdminReportText(
              report.details ||
              "No additional details"
            )}
          </p>

        </div>


        <div class="admin-report-users">

          <div class="admin-report-user-box">

            <span>
              Reporter
            </span>

            <strong>
              ${reporterName}
            </strong>

            <small>
              ${escapeAdminReportText(
                reporter?.email ||
                "-"
              )}
            </small>

          </div>


          <div class="admin-report-user-box">

            <span>
              Reported User
            </span>

            <strong>
              ${reportedName}
            </strong>

            <small>
              ${escapeAdminReportText(
                reportedUser?.email ||
                "-"
              )}
            </small>

          </div>

        </div>


        <span class="admin-report-date">

          Submitted:
          ${formatAdminReportDate(
            report.created_at
          )}

        </span>


        <div class="admin-report-actions">

          <a
            href="view-profile.html?id=${encodeURIComponent(
              report.reported_user_id
            )}"
            class="admin-report-view-btn"
            target="_blank">

            👤 View Profile

          </a>


          <button
            type="button"
            class="admin-report-review-btn"
            data-report-id="${report.id}"
            data-action="reviewed">

            🔵 Mark Reviewed

          </button>


          <button
            type="button"
            class="admin-report-resolve-btn"
            data-report-id="${report.id}"
            data-action="resolved">

            ✅ Resolve

          </button>


          <button
            type="button"
            class="admin-report-reject-btn"
            data-report-id="${report.id}"
            data-action="rejected">

            ❌ Reject

          </button>

        </div>
      `;


      reportsContainer.appendChild(
        card
      );

    });

  }


  // Global banaya hai kyunki
  // admin.html ke filter buttons onclick use karte hain

  window.loadAdminReports =
    loadAdminReports;


  loadAdminReports(
    currentReportFilter
  );

})();

// ======================================
// ADMIN REPORTS MANAGEMENT - PART 2
// UPDATE REPORT STATUS
// ======================================

(function () {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop();

  if (!currentPage.startsWith("admin") || currentPage === "admin-login.html") {
    return;
  }

  const reportsContainer =
    document.getElementById(
      "adminReportsList"
    );

  if (!reportsContainer) {
    return;
  }


  async function updateAdminReportStatus(
    reportId,
    newStatus,
    clickedButton
  ) {

    if (!reportId || !newStatus) {

      alert(
        "Report ID ya status nahi mila."
      );

      return;

    }


    const allowedStatuses = [
      "reviewed",
      "resolved",
      "rejected"
    ];


    if (
      !allowedStatuses.includes(
        newStatus
      )
    ) {

      alert(
        "Invalid report status."
      );

      return;

    }


    const confirmationText = {

      reviewed:
        "Kya aap is report ko Reviewed mark karna chahte hain?",

      resolved:
        "Kya aap is report ko Resolved mark karna chahte hain?",

      rejected:
        "Kya aap is report ko Reject karna chahte hain?"

    };


    const confirmed =
      confirm(
        confirmationText[newStatus]
      );


    if (!confirmed) {
      return;
    }


    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();


    if (userError || !user) {

      alert(
        "Admin login required."
      );

      window.location.href =
        "login.html";

      return;

    }


    const {
      data: admin,
      error: adminError
    } = await client
      .from("admins")
      .select("id, active")
      .eq("id", user.id)
      .maybeSingle();


    if (
      adminError ||
      !admin ||
      admin.active !== true
    ) {

      alert(
        "Sirf active admin report update kar sakta hai."
      );

      return;

    }


    const oldText =
      clickedButton
        ? clickedButton.textContent
        : "";


    if (clickedButton) {

      clickedButton.disabled = true;

      clickedButton.textContent =
        "Updating...";

    }


    const {
      data,
      error
    } = await client
      .from("user_reports")
      .update({
        status:
          newStatus,

        reviewed_at:
          new Date().toISOString(),

        reviewed_by:
          user.id
      })
      .eq(
        "id",
        reportId
      )
      .select(
        "id, status"
      );


    if (clickedButton) {

      clickedButton.disabled = false;

      clickedButton.textContent =
        oldText;

    }


    if (error) {

      alert(
        "Report update nahi hui: " +
        error.message
      );

      return;

    }


    if (
      !data ||
      data.length === 0
    ) {

      alert(
        "Report record nahi mila ya update permission nahi hai."
      );

      return;

    }


    let successMessage =
      "Report status update ho gaya.";


    if (newStatus === "reviewed") {

      successMessage =
        "Report Reviewed mark ho gayi.";

    }


    if (newStatus === "resolved") {

      successMessage =
        "Report successfully resolve ho gayi.";

    }


    if (newStatus === "rejected") {

      successMessage =
        "Report reject ho gayi.";

    }


    alert(
      successMessage
    );


    if (
      typeof window.loadAdminReports ===
      "function"
    ) {

      await window.loadAdminReports(
        "pending"
      );

    }

  }


  reportsContainer.addEventListener(
    "click",
    async function (event) {

      const actionButton =
        event.target.closest(
          "[data-report-id][data-action]"
        );


      if (!actionButton) {
        return;
      }


      const reportId =
        actionButton.getAttribute(
          "data-report-id"
        );


      const action =
        actionButton.getAttribute(
          "data-action"
        );


      await updateAdminReportStatus(
        reportId,
        action,
        actionButton
      );

    }
  );


})();
// ======================================
// ADMIN REPORTS MANAGEMENT - PART 3
// BLOCK / UNBLOCK REPORTED USER
// ======================================

(function () {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop();

  if (!currentPage.startsWith("admin") || currentPage === "admin-login.html") {
    return;
  }

  const reportsContainer =
    document.getElementById(
      "adminReportsList"
    );

  if (!reportsContainer) {
    return;
  }


  // ======================================
  // ADD BLOCK BUTTONS TO REPORT CARDS
  // ======================================

  async function addReportBlockButtons() {

    const reportCards =
      reportsContainer.querySelectorAll(
        ".admin-report-card"
      );

    for (const card of reportCards) {

      const actions =
        card.querySelector(
          ".admin-report-actions"
        );

      const profileLink =
        card.querySelector(
          ".admin-report-view-btn"
        );

      if (
        !actions ||
        !profileLink ||
        actions.querySelector(
          ".admin-report-block-btn"
        )
      ) {
        continue;
      }

      const profileUrl =
        new URL(
          profileLink.href,
          window.location.href
        );

      const reportedUserId =
        profileUrl.searchParams.get("id");

      if (!reportedUserId) {
        continue;
      }


      const {
        data: profile,
        error
      } = await client
        .from("profiles")
        .select("id, blocked")
        .eq(
          "id",
          reportedUserId
        )
        .maybeSingle();


      if (error || !profile) {

        console.error(
          "Reported profile status error:",
          error?.message
        );

        continue;

      }


      const blockButton =
        document.createElement("button");

      blockButton.type = "button";

      blockButton.className =
        "admin-report-block-btn";

      blockButton.setAttribute(
        "data-reported-user-id",
        reportedUserId
      );

      blockButton.setAttribute(
        "data-blocked",
        String(
          profile.blocked === true
        )
      );


      if (profile.blocked === true) {

        blockButton.textContent =
          "🔓 Unblock User";

        blockButton.style.background =
          "linear-gradient(135deg,#16a34a,#15803d)";

      } else {

        blockButton.textContent =
          "🚫 Block User";

        blockButton.style.background =
          "linear-gradient(135deg,#7f1d1d,#dc2626)";

      }

      blockButton.style.color =
        "#ffffff";

      actions.appendChild(
        blockButton
      );

    }

  }


  // ======================================
  // BLOCK / UNBLOCK REPORTED USER
  // ======================================

  async function changeReportedUserBlockStatus(
    button
  ) {

    const reportedUserId =
      button.getAttribute(
        "data-reported-user-id"
      );

    const currentlyBlocked =
      button.getAttribute(
        "data-blocked"
      ) === "true";

    if (!reportedUserId) {

      alert(
        "Reported User ID nahi mili."
      );

      return;

    }


    const actionText =
      currentlyBlocked
        ? "unblock"
        : "block";


    const confirmed =
      confirm(
        `Kya aap is reported user ko ${actionText} karna chahte hain?`
      );

    if (!confirmed) {
      return;
    }


    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();


    if (userError || !user) {

      alert(
        "Admin login required."
      );

      return;

    }


    const {
      data: admin,
      error: adminError
    } = await client
      .from("admins")
      .select("id, active")
      .eq("id", user.id)
      .maybeSingle();


    if (
      adminError ||
      !admin ||
      admin.active !== true
    ) {

      alert(
        "Sirf active admin ye action kar sakta hai."
      );

      return;

    }


    const oldText =
      button.textContent;

    button.disabled = true;

    button.textContent =
      currentlyBlocked
        ? "Unblocking..."
        : "Blocking...";


    const {
      data,
      error
    } = await client
      .from("profiles")
      .update({
        blocked:
          !currentlyBlocked
      })
      .eq(
        "id",
        reportedUserId
      )
      .select("id, blocked");


    button.disabled = false;


    if (error) {

      button.textContent =
        oldText;

      alert(
        "User status update nahi hua: " +
        error.message
      );

      return;

    }


    if (!data || data.length === 0) {

      button.textContent =
        oldText;

      alert(
        "Profile record nahi mila ya update permission nahi hai."
      );

      return;

    }


    const isNowBlocked =
      data[0].blocked === true;


    button.setAttribute(
      "data-blocked",
      String(isNowBlocked)
    );


    if (isNowBlocked) {

      button.textContent =
        "🔓 Unblock User";

      button.style.background =
        "linear-gradient(135deg,#16a34a,#15803d)";

      alert(
        "Reported user successfully blocked."
      );

    } else {

      button.textContent =
        "🚫 Block User";

      button.style.background =
        "linear-gradient(135deg,#7f1d1d,#dc2626)";

      alert(
        "Reported user successfully unblocked."
      );

    }

  }


  // ======================================
  // BUTTON CLICK
  // ======================================

  reportsContainer.addEventListener(
    "click",
    async function (event) {

      const blockButton =
        event.target.closest(
          ".admin-report-block-btn"
        );

      if (!blockButton) {
        return;
      }

      await changeReportedUserBlockStatus(
        blockButton
      );

    }
  );


  // Reports load/change hone ke baad
  // block buttons automatically add honge.

  const reportsObserver =
    new MutationObserver(
      function () {

        addReportBlockButtons();

      }
    );


  reportsObserver.observe(
    reportsContainer,
    {
      childList: true,
      subtree: true
    }
  );


  addReportBlockButtons();

})();

// ======================================
// ADMIN PENDING REPORT COUNT
// ======================================

(async function () {

  if (
    !(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))
  ) {
    return;
  }

  const countElement =
    document.getElementById(
      "pendingReports"
    );

  if (!countElement) {
    return;
  }

  const {
    count,
    error
  } = await client
    .from("user_reports")
    .select("*", {
      count: "exact",
      head: true
    })
    .eq("status", "pending");

  if (error) {

    console.error(
      "Pending reports count error:",
      error.message
    );

    countElement.textContent = "0";

    return;
  }

  countElement.textContent =
    String(count || 0);

})();

// ======================================
// ADMIN NOTIFICATION CENTRE - PART 1
// BELL + COUNT + PANEL
// ======================================

(function () {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop();

  if (!currentPage.startsWith("admin") || currentPage === "admin-login.html") {
    return;
  }

  const notificationBox =
    document.querySelector(
      ".admin-notification-box"
    );

  const notificationButton =
    document.getElementById(
      "adminNotificationBtn"
    );

  const notificationCount =
    document.getElementById(
      "adminNotificationCount"
    );

  if (
    !notificationBox ||
    !notificationButton ||
    !notificationCount
  ) {
    return;
  }


  // ======================================
  // CREATE NOTIFICATION PANEL
  // ======================================

  const notificationPanel =
    document.createElement("div");

  notificationPanel.className =
    "admin-notification-panel";

  notificationPanel.innerHTML = `
    <div class="admin-notification-header">

      <span>
        🔔 Admin Notifications
      </span>

      <button
        type="button"
        id="adminMarkAllNotificationsRead"
        style="
          float:right;
          border:none;
          background:none;
          color:#2563eb;
          font-weight:bold;
          cursor:pointer;
        ">

        Mark All Read

      </button>

    </div>

    <div
      id="adminNotificationList"
      class="admin-notification-list">

      <div class="admin-notification-item">

        <p>
          Loading notifications...
        </p>

      </div>

    </div>
  `;

  notificationBox.appendChild(
    notificationPanel
  );


  const notificationList =
    document.getElementById(
      "adminNotificationList"
    );


  // ======================================
  // SAFE TEXT
  // ======================================

  function escapeAdminNotificationText(
    value
  ) {

    const element =
      document.createElement("div");

    element.textContent =
      value || "";

    return element.innerHTML;

  }


  // ======================================
  // DATE FORMAT
  // ======================================

  function formatAdminNotificationTime(
    dateValue
  ) {

    if (!dateValue) {
      return "";
    }

    const date =
      new Date(dateValue);

    const now =
      new Date();

    const seconds =
      Math.floor(
        (
          now.getTime() -
          date.getTime()
        ) / 1000
      );

    if (seconds < 60) {
      return "Just now";
    }

    const minutes =
      Math.floor(seconds / 60);

    if (minutes < 60) {

      return (
        minutes +
        (
          minutes === 1
            ? " minute ago"
            : " minutes ago"
        )
      );

    }

    const hours =
      Math.floor(minutes / 60);

    if (hours < 24) {

      return (
        hours +
        (
          hours === 1
            ? " hour ago"
            : " hours ago"
        )
      );

    }

    const days =
      Math.floor(hours / 24);

    if (days === 1) {
      return "Yesterday";
    }

    if (days < 7) {
      return days + " days ago";
    }

    return date.toLocaleString(
      "en-IN"
    );

  }


  // ======================================
  // NOTIFICATION ICON
  // ======================================

  function getAdminNotificationIcon(
    type
  ) {

    const notificationType =
      String(type || "")
        .toLowerCase();

    if (
      notificationType.includes("user")
    ) {
      return "👤";
    }

    if (
      notificationType.includes("payment") ||
      notificationType.includes("membership")
    ) {
      return "💳";
    }

    if (
      notificationType.includes("interest")
    ) {
      return "❤️";
    }

    if (
      notificationType.includes("report")
    ) {
      return "🚩";
    }

    if (
      notificationType.includes("contact")
    ) {
      return "📩";
    }

    return "🔔";

  }


  // ======================================
  // LOAD ADMIN NOTIFICATIONS
  // ======================================

  async function loadAdminNotifications() {

    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();

    if (userError || !user) {

      notificationCount.textContent =
        "0";

      notificationList.innerHTML = `
        <div class="admin-notification-item">

          <h4>
            Admin Login Required
          </h4>

          <p>
            Notifications dekhne ke liye admin login karein.
          </p>

        </div>
      `;

      return;

    }


    const {
      data: admin,
      error: adminError
    } = await client
      .from("admins")
      .select("id, active")
      .eq("id", user.id)
      .maybeSingle();


    if (
      adminError ||
      !admin ||
      admin.active !== true
    ) {

      notificationCount.textContent =
        "0";

      notificationList.innerHTML = `
        <div class="admin-notification-item">

          <h4>
            Access Denied
          </h4>

          <p>
            Sirf active admin notifications dekh sakta hai.
          </p>

        </div>
      `;

      return;

    }


    const {
      data: notifications,
      error
    } = await client
      .from("admin_notifications")
      .select(`
        id,
        type,
        title,
        message,
        reference_id,
        is_read,
        created_at
      `)
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(50);


    if (error) {

      notificationCount.textContent =
        "0";

      notificationList.innerHTML = `
        <div class="admin-notification-item">

          <h4>
            Notifications load nahi hui
          </h4>

          <p>
            ${escapeAdminNotificationText(
              error.message
            )}
          </p>

        </div>
      `;

      return;

    }


    const unreadCount =
      (notifications || [])
        .filter(
          item =>
            item.is_read !== true
        )
        .length;


    notificationCount.textContent =
      String(unreadCount);


    if (
      !notifications ||
      notifications.length === 0
    ) {

      notificationList.innerHTML = `
        <div class="admin-notification-item">

          <h4>
            No Notifications
          </h4>

          <p>
            Abhi koi admin notification nahi hai.
          </p>

        </div>
      `;

      return;

    }


    notificationList.innerHTML = "";


    notifications.forEach(
      notification => {

        const item =
          document.createElement("div");

        item.className =
          "admin-notification-item";

        if (
          notification.is_read !== true
        ) {

          item.style.borderLeft =
            "4px solid #2563eb";

          item.style.background =
            "#eff6ff";

        }


        item.setAttribute(
          "data-admin-notification-id",
          notification.id
        );


        item.innerHTML = `

          <h4>

            ${getAdminNotificationIcon(
              notification.type
            )}

            ${escapeAdminNotificationText(
              notification.title ||
              "Admin Notification"
            )}

          </h4>


          <p>

            ${escapeAdminNotificationText(
              notification.message || ""
            )}

          </p>


          <span class="admin-notification-time">

            ${formatAdminNotificationTime(
              notification.created_at
            )}

          </span>

        `;


        notificationList.appendChild(
          item
        );

      }
    );

  }


  // ======================================
  // TOGGLE PANEL
  // ======================================

  notificationButton.addEventListener(
    "click",
    function (event) {

      event.stopPropagation();

      const isVisible =
        notificationPanel.style.display ===
        "block";

      notificationPanel.style.display =
        isVisible
          ? "none"
          : "block";

      if (!isVisible) {
        loadAdminNotifications();
      }

    }
  );


  document.addEventListener(
    "click",
    function (event) {

      if (
        !notificationBox.contains(
          event.target
        )
      ) {

        notificationPanel.style.display =
          "none";

      }

    }
  );


  window.loadAdminNotifications =
    loadAdminNotifications;


  loadAdminNotifications();

})();

// ======================================
// ADMIN NOTIFICATION CENTRE - PART 2
// MARK READ + AUTO REFRESH
// ======================================

(function () {

  if (
    !(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))
  ) {
    return;
  }

  const notificationList =
    document.getElementById(
      "adminNotificationList"
    );

  const markAllButton =
    document.getElementById(
      "adminMarkAllNotificationsRead"
    );

  if (!notificationList) {
    return;
  }

  // ======================================
  // MARK ONE READ
  // ======================================

  async function markNotificationRead(id) {

    if (!id) return;

    await client
      .from("admin_notifications")
      .update({
        is_read: true
      })
      .eq("id", id);

    if (
      typeof window.loadAdminNotifications ===
      "function"
    ) {

      window.loadAdminNotifications();

    }

  }

  // ======================================
  // MARK ALL READ
  // ======================================

  async function markAllRead() {

    await client
      .from("admin_notifications")
      .update({
        is_read: true
      })
      .eq("is_read", false);

    if (
      typeof window.loadAdminNotifications ===
      "function"
    ) {

      window.loadAdminNotifications();

    }

  }

  // ======================================
  // EVENTS
  // ======================================

  notificationList.addEventListener(
    "click",
    async function (event) {

      const item =
        event.target.closest(
          "[data-admin-notification-id]"
        );

      if (!item) return;

      await markNotificationRead(
        item.dataset.adminNotificationId
      );

    }
  );

  if (markAllButton) {

    markAllButton.addEventListener(
      "click",
      async function () {

        await markAllRead();

      }
    );

  }

  // ======================================
  // AUTO REFRESH
  // ======================================

  setInterval(function () {

    if (
      typeof window.loadAdminNotifications ===
      "function"
    ) {

      window.loadAdminNotifications();

    }

  }, 30000);

})();

// ======================================
// SUCCESS STORY SUBMIT
// PART 1
// ======================================

const successStoryForm =
document.getElementById(
"successStoryForm"
);

if(successStoryForm){

successStoryForm.addEventListener(
"submit",
submitSuccessStory
);

}

async function submitSuccessStory(e){

e.preventDefault();

const {
data:{user}
}=await client.auth.getUser();

if(!user){

alert("Please login first.");

return;

}

const partnerName=
document.getElementById(
"storyPartnerName"
).value.trim();

const title=
document.getElementById(
"storyTitle"
).value.trim();

const marriageDate=
document.getElementById(
"storyMarriageDate"
).value;

const state=
document.getElementById(
"storyState"
).value.trim();

const city=
document.getElementById(
"storyCity"
).value.trim();

const story=
document.getElementById(
"storyText"
).value.trim();

const photoInput=
document.getElementById(
"storyPhoto"
);

let photoUrl="";

if(
photoInput &&
photoInput.files.length>0
){

const file=
photoInput.files[0];

const fileName=
Date.now()+
"-"+
file.name;

const {
error:uploadError
}=await client.storage
.from("success-stories")
.upload(
fileName,
file
);

if(uploadError){

alert(uploadError.message);

return;

}

const {
data
}=client.storage
.from("success-stories")
.getPublicUrl(fileName);

photoUrl=
data.publicUrl;

}

const {
error
}=await client
.from("success_stories")
.insert({

user_id:user.id,

partner_name:partnerName,

title:title,

story:story,

couple_photo:photoUrl,

marriage_date:marriageDate,

city:city,

state:state

});

if(error){

alert(error.message);

return;

}

alert(
"Success Story Submitted Successfully.\nWaiting for Admin Approval."
);

successStoryForm.reset();

}

// ======================================
// ADMIN SUCCESS STORIES
// LOAD + APPROVE + REJECT
// ======================================

(function () {

  if (
    !(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))
  ) {
    return;
  }

  const storiesContainer =
    document.getElementById(
      "adminSuccessStories"
    );

  if (!storiesContainer) return;


  function safeStoryText(value) {

    const div =
      document.createElement("div");

    div.textContent =
      value || "";

    return div.innerHTML;

  }


  async function loadAdminSuccessStories() {

    storiesContainer.innerHTML = `
      <div class="admin-loading-card">
        <div class="admin-loader"></div>
        <p>Loading Success Stories...</p>
      </div>
    `;

    const {
      data: stories,
      error
    } = await client
      .from("success_stories")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) {

      storiesContainer.innerHTML = `
        <div class="admin-report-empty">
          <h3>Stories load nahi hui</h3>
          <p>${safeStoryText(error.message)}</p>
        </div>
      `;

      return;
    }

    if (!stories || stories.length === 0) {

      storiesContainer.innerHTML = `
        <div class="admin-report-empty">
          <h3>No Success Stories</h3>
          <p>Abhi koi story submit nahi hui.</p>
        </div>
      `;

      return;
    }

    storiesContainer.innerHTML = "";

    stories.forEach(story => {

      const card =
        document.createElement("article");

      card.className =
        "admin-report-card";

      const photo =
        story.couple_photo
          ? `
            <img
              src="${story.couple_photo}"
              alt="Couple Photo"
              style="
                width:100%;
                max-height:260px;
                object-fit:cover;
                border-radius:14px;
                margin-bottom:15px;
              ">
          `
          : "";

      card.innerHTML = `

        ${photo}

        <h3>
          ${safeStoryText(
            story.title
          )}
        </h3>

        <p>
          <strong>Partner:</strong>
          ${safeStoryText(
            story.partner_name
          )}
        </p>

        <p>
          <strong>Marriage Date:</strong>
          ${story.marriage_date || "-"}
        </p>

        <p>
          <strong>Location:</strong>
          ${safeStoryText(
            story.city || "-"
          )},
          ${safeStoryText(
            story.state || "-"
          )}
        </p>

        <div class="admin-report-section">

          <strong>Story</strong>

          <p>
            ${safeStoryText(
              story.story
            )}
          </p>

        </div>

        <p>
          <strong>Status:</strong>
          ${safeStoryText(
            story.status
          )}
        </p>

        <div class="admin-report-actions">

          <button
            type="button"
            class="admin-report-resolve-btn"
            data-story-id="${story.id}"
            data-story-action="approved">

            ✅ Approve

          </button>

          <button
            type="button"
            class="admin-report-reject-btn"
            data-story-id="${story.id}"
            data-story-action="rejected">

            ❌ Reject

          </button>

        </div>
      `;

      storiesContainer.appendChild(
        card
      );

    });

  }


  storiesContainer.addEventListener(
    "click",
    async function (event) {

      const button =
        event.target.closest(
          "[data-story-id][data-story-action]"
        );

      if (!button) return;

      const storyId =
        button.getAttribute(
          "data-story-id"
        );

      const action =
        button.getAttribute(
          "data-story-action"
        );

      const {
        data: { user }
      } = await client.auth.getUser();

      if (!user) {

        alert("Admin login required.");

        return;
      }

      button.disabled = true;
      button.textContent =
        "Updating...";

      const updateData = {
        status: action
      };

      if (action === "approved") {

        updateData.approved_at =
          new Date().toISOString();

        updateData.approved_by =
          user.id;

      }

      const { error } = await client
        .from("success_stories")
        .update(updateData)
        .eq("id", storyId);

      if (error) {

        alert(error.message);

        button.disabled = false;

        return;
      }

      alert(
        action === "approved"
          ? "Story Approved"
          : "Story Rejected"
      );

      loadAdminSuccessStories();

    }
  );


  loadAdminSuccessStories();

})();

// ======================================
// PUBLIC SUCCESS STORIES
// ======================================

(async function () {

  if (
    !window.location.pathname.includes(
      "success-stories.html"
    )
  ) {
    return;
  }

  const container =
    document.getElementById(
      "successStoriesList"
    );

  if (!container) return;

  const {
    data: stories,
    error
  } = await client
    .from("success_stories")
    .select("*")
    .eq("status","approved")
    .order("created_at",{
      ascending:false
    });

  if(error){

    container.innerHTML=
    "<p>Stories load failed.</p>";

    return;

  }

  if(!stories || stories.length===0){

    container.innerHTML=
    "<p>No Success Stories Available.</p>";

    return;

  }

  container.innerHTML="";

  stories.forEach(story=>{

    container.innerHTML+=`

<div class="success-story-card">

<img
src="${story.couple_photo||''}"
class="success-story-photo">

<h2>
${story.title}
</h2>

<h4>
💑 ${story.partner_name}
</h4>

<p>
📍 ${story.city||"-"},
${story.state||"-"}
</p>

<p>
📅 ${story.marriage_date||"-"}
</p>

<div class="success-story-text">

${story.story}

</div>

</div>

`;

  });

})();

// ======================================
// DEACTIVATE / DELETE ACCOUNT REQUEST
// ======================================

(function () {

  if (
    !window.location.pathname.includes(
      "profile.html"
    )
  ) {
    return;
  }

  const deactivateButton =
    document.getElementById(
      "deactivateAccountBtn"
    );

  const deleteButton =
    document.getElementById(
      "deleteAccountBtn"
    );

  if (
    !deactivateButton ||
    !deleteButton
  ) {
    return;
  }


  // ======================================
  // DEACTIVATE ACCOUNT
  // ======================================

  deactivateButton.addEventListener(
    "click",
    async function () {

      const confirmed =
        confirm(
          "Account deactivate karne ke baad profile search aur matches me hide ho jayegi. Continue?"
        );

      if (!confirmed) {
        return;
      }

      const {
        data: { user },
        error: userError
      } = await client.auth.getUser();

      if (userError || !user) {

        alert("Please login first.");

        return;

      }

      deactivateButton.disabled = true;

      deactivateButton.textContent =
        "Deactivating...";

      const {
        error
      } = await client
        .from("profiles")
        .update({
          account_status: "deactivated",
          deactivated_at:
            new Date().toISOString(),
          is_online: false,
          last_seen:
            new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) {

        deactivateButton.disabled = false;

        deactivateButton.textContent =
          "⏸ Deactivate Account";

        alert(
          "Account deactivate nahi hua: " +
          error.message
        );

        return;

      }

      await client.auth.signOut({ scope: "local" });

      alert(
        "Account successfully deactivate ho gaya."
      );

      window.location.href =
        "login.html";

    }
  );


  // ======================================
  // REQUEST ACCOUNT DELETION
  // ======================================

  deleteButton.addEventListener(
    "click",
    async function () {

      const confirmed =
        confirm(
          "Permanent account deletion request bhejna chahte hain? Admin review ke baad account delete hoga."
        );

      if (!confirmed) {
        return;
      }

      const reason =
        prompt(
          "Account delete karne ka reason likhein:"
        );

      if (!reason || !reason.trim()) {

        alert(
          "Deletion reason required hai."
        );

        return;

      }

      const {
        data: { user },
        error: userError
      } = await client.auth.getUser();

      if (userError || !user) {

        alert("Please login first.");

        return;

      }

      deleteButton.disabled = true;

      deleteButton.textContent =
        "Submitting...";

      const {
        error
      } = await client
        .from("profiles")
        .update({
          account_status:
            "deletion_requested",

          deletion_requested_at:
            new Date().toISOString(),

          deletion_reason:
            reason.trim(),

          is_online:
            false,

          last_seen:
            new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) {

        deleteButton.disabled = false;

        deleteButton.textContent =
          "🗑 Request Account Deletion";

        alert(
          "Deletion request submit nahi hui: " +
          error.message
        );

        return;

      }

      await client
        .from("admin_notifications")
        .insert({
          type:
            "account_deletion",

          title:
            "Account Deletion Request",

          message:
            "A user requested permanent account deletion.",

          reference_id:
            user.id
        });

      await client.auth.signOut({ scope: "local" });

      alert(
        "Account deletion request admin ko bhej di gayi."
      );

      window.location.href =
        "login.html";

    }
  );

})();

const resetButton =
document.querySelector(
".search-reset-button"
);

if(resetButton){

resetButton.addEventListener(
"click",
function(){

document.getElementById("searchGender").value="";

document.getElementById("searchAge").value="";

document.getElementById("searchState").value="";

document.getElementById("searchDisability").value="";

loadProfiles();

});

}

// ======================================
// ADMIN BROADCAST MESSAGE
// ======================================

(function () {

  if (
    !(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))
  ) {
    return;
  }

  const sendBroadcastBtn =
    document.getElementById(
      "sendBroadcastBtn"
    );

  if (!sendBroadcastBtn) {
    return;
  }

  sendBroadcastBtn.addEventListener(
    "click",
    async function () {

      const title =
        document
          .getElementById("broadcastTitle")
          .value
          .trim();

      const message =
        document
          .getElementById("broadcastMessage")
          .value
          .trim();

      if (!title || !message) {

        alert(
          "Title aur message dono required hain."
        );

        return;

      }

      const {
        data: { user },
        error: userError
      } = await client.auth.getUser();

      if (userError || !user) {

        alert("Admin login required.");

        return;

      }

      sendBroadcastBtn.disabled = true;

      sendBroadcastBtn.textContent =
        "Sending...";

      const {
        error
      } = await client
        .from("broadcast_messages")
        .insert({
          title: title,
          message: message,
          created_by: user.id,
          active: true
        });

      sendBroadcastBtn.disabled = false;

      sendBroadcastBtn.textContent =
        "📢 Send Broadcast";

      if (error) {

        alert(
          "Broadcast send nahi hua: " +
          error.message
        );

        return;

      }

      document.getElementById(
        "broadcastTitle"
      ).value = "";

      document.getElementById(
        "broadcastMessage"
      ).value = "";

      alert(
        "Broadcast successfully send ho gaya."
      );

    }
  );

})();

// ======================================
// USER DASHBOARD BROADCAST MESSAGE
// ======================================

(async function () {

  if (
    !window.location.pathname.includes(
      "profile.html"
    )
  ) {
    return;
  }

  const broadcastBox =
    document.getElementById(
      "broadcastBox"
    );

  const titleElement =
    document.getElementById(
      "broadcastTitleText"
    );

  const messageElement =
    document.getElementById(
      "broadcastMessageText"
    );

  if (
    !broadcastBox ||
    !titleElement ||
    !messageElement
  ) {
    return;
  }

  const {
    data,
    error
  } = await client
    .from("broadcast_messages")
    .select(
      "title,message,created_at"
    )
    .eq("active", true)
    .order("created_at", {
      ascending: false
    })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    broadcastBox.style.display =
      "none";
    return;
  }

  titleElement.textContent =
    data.title;

  messageElement.textContent =
    data.message;

  broadcastBox.style.display =
    "block";

})();

// ======================================
// DARK MODE TOGGLE
// ======================================

(function () {

  const toggleButton =
    document.getElementById(
      "darkModeToggle"
    );

  const savedTheme =
    localStorage.getItem(
      "divyangsathi-theme"
    );

  if (savedTheme === "dark") {

    document.body.classList.add(
      "dark-mode"
    );

  }

  if (!toggleButton) {
    return;
  }

  function updateButtonText() {

    const darkModeActive =
      document.body.classList.contains(
        "dark-mode"
      );

    toggleButton.textContent =
      darkModeActive
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";

  }

  updateButtonText();

  toggleButton.addEventListener(
    "click",
    function () {

      document.body.classList.toggle(
        "dark-mode"
      );

      const darkModeActive =
        document.body.classList.contains(
          "dark-mode"
        );

      localStorage.setItem(
        "divyangsathi-theme",
        darkModeActive
          ? "dark"
          : "light"
      );

      updateButtonText();

    }
  );

})();

// ======================================
// ADMIN DARK MODE
// ======================================

(function () {

  if (
    !(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))
  ) {
    return;
  }

  const toggleButton =
    document.getElementById(
      "adminDarkModeToggle"
    );

  if (!toggleButton) {
    return;
  }

  const savedTheme =
    localStorage.getItem(
      "divyangsathi-admin-theme"
    );

  if (savedTheme === "dark") {

    document.body.classList.add(
      "admin-dark-mode"
    );

  }


  function updateAdminThemeButton() {

    const darkModeActive =
      document.body.classList.contains(
        "admin-dark-mode"
      );

    toggleButton.textContent =
      darkModeActive
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";

  }


  updateAdminThemeButton();


  toggleButton.addEventListener(
    "click",
    function () {

      document.body.classList.toggle(
        "admin-dark-mode"
      );

      const darkModeActive =
        document.body.classList.contains(
          "admin-dark-mode"
        );

      localStorage.setItem(
        "divyangsathi-admin-theme",
        darkModeActive
          ? "dark"
          : "light"
      );

      updateAdminThemeButton();

    }
  );

})();

// ======================================
// INSTALL APP POPUP
// ======================================

let deferredPrompt;

window.addEventListener(
"beforeinstallprompt",
function(e){

e.preventDefault();

deferredPrompt=e;

const popup=
document.getElementById(
"installPopup"
);

if(
popup &&
!localStorage.getItem(
"hideInstallPopup"
)
){

popup.style.display="flex";

}

});

const installBtn=
document.getElementById(
"installAppBtn"
);

if(installBtn){

installBtn.onclick=
async function(){

if(!deferredPrompt)
return;

deferredPrompt.prompt();

await deferredPrompt.userChoice;

deferredPrompt=null;

document.getElementById(
"installPopup"
).style.display="none";

};

}

const closeBtn=
document.getElementById(
"closeInstallPopup"
);

if(closeBtn){

closeBtn.onclick=
function(){

document.getElementById(
"installPopup"
).style.display="none";

localStorage.setItem(
"hideInstallPopup",
"true"
);

};

}

window.addEventListener(
"appinstalled",
function(){

localStorage.removeItem(
"hideInstallPopup"
);

});

// ======================================
// USER PROFILE PDF - FINAL FULL DETAILS
// ======================================

const downloadProfilePdfBtn =
document.getElementById("downloadProfilePdfBtn");

if(downloadProfilePdfBtn){

downloadProfilePdfBtn.addEventListener(
"click",
async function(){

try{

if(typeof html2pdf === "undefined"){
alert("PDF library load nahi hui.");
return;
}

function field(id){

const el =
document.getElementById(id);

if(!el)return "-";

const value =
typeof el.value !== "undefined"
? el.value
: el.textContent;

return String(value || "").trim() || "-";

}

function status(id){

const el =
document.getElementById(id);

return el
? String(el.textContent || "").trim() || "-"
: "-";

}

const name =
field("profileName");

const photo =
document.getElementById(
"profilePhotoProfessionalPreview"
);

const photoUrl =
photo &&
photo.src &&
photo.style.display !== "none"
? photo.src
: "";

const box =
document.createElement("div");

box.style.cssText =
`
width:760px;
background:#ffffff;
color:#111827;
padding:32px;
font-family:Arial,sans-serif;
font-size:14px;
line-height:1.5;
box-sizing:border-box;
`;

function row(label,value){

return `
<tr>
<td style="
padding:9px 10px;
width:220px;
font-weight:700;
border-bottom:1px solid #e5e7eb;
">
${label}
</td>

<td style="
padding:9px 10px;
border-bottom:1px solid #e5e7eb;
">
${value || "-"}
</td>
</tr>
`;

}

box.innerHTML = `

<div style="
text-align:center;
border-bottom:3px solid #2563eb;
padding-bottom:18px;
margin-bottom:24px;
">

<h1 style="
margin:0;
font-size:28px;
color:#1d4ed8;
">
DivyangSathi
</h1>

<div style="
margin-top:5px;
color:#64748b;
">
Matrimony Profile
</div>

</div>


<div style="
display:flex;
align-items:center;
gap:22px;
margin-bottom:25px;
">

${
photoUrl
?
`
<img
src="${photoUrl}"
style="
width:120px;
height:120px;
object-fit:cover;
border-radius:14px;
border:2px solid #dbeafe;
">
`
:
`
<div style="
width:120px;
height:120px;
display:flex;
align-items:center;
justify-content:center;
background:#eff6ff;
border-radius:14px;
font-size:42px;
">
👤
</div>
`
}

<div>

<h2 style="
margin:0 0 10px;
font-size:24px;
">
${name}
</h2>

<div>
<b>Profile:</b>
${status("profileStatusText")}
</div>

<div>
<b>Verification:</b>
${status("dashboardVerificationStatus")}
</div>

<div>
<b>Membership:</b>
${status("dashboardMembershipStatus")}
</div>

</div>

</div>


<h3 style="
color:#1d4ed8;
border-bottom:2px solid #dbeafe;
padding-bottom:6px;
">
Personal Information
</h3>

<table style="
width:100%;
border-collapse:collapse;
margin-bottom:22px;
">

${row("Full Name",field("profileName"))}
${row("Email",field("profileEmail"))}
${row("Mobile",field("profileMobile"))}
${row("Gender",field("profileGender"))}
${row("Date of Birth",field("dateOfBirth"))}
${row("Age",field("age"))}
${row("Religion",field("religion"))}
${row("Caste",field("caste"))}
${row("Marital Status",field("maritalStatus"))}
${row("Height",field("height"))}
${row("Weight",field("weight"))}

</table>


<h3 style="
color:#1d4ed8;
border-bottom:2px solid #dbeafe;
padding-bottom:6px;
">
Disability Details
</h3>

<table style="
width:100%;
border-collapse:collapse;
margin-bottom:22px;
">

${row(
"Disability Type",
field("disabilityType")
)}

${row(
"Disability Percentage",
field("disabilityPercentage")
)}

</table>


<h3 style="
color:#1d4ed8;
border-bottom:2px solid #dbeafe;
padding-bottom:6px;
">
Education & Career
</h3>

<table style="
width:100%;
border-collapse:collapse;
margin-bottom:22px;
">

${row("Education",field("education"))}
${row("Occupation",field("occupation"))}
${row("Annual Income",field("income"))}

</table>


<h3 style="
color:#1d4ed8;
border-bottom:2px solid #dbeafe;
padding-bottom:6px;
">
Location
</h3>

<table style="
width:100%;
border-collapse:collapse;
margin-bottom:22px;
">

${row("State",field("state"))}
${row("District",field("district"))}
${row("City",field("city"))}

</table>


<h3 style="
color:#1d4ed8;
border-bottom:2px solid #dbeafe;
padding-bottom:6px;
">
About Me
</h3>

<div style="
padding:12px;
background:#f8fafc;
border-radius:10px;
margin-bottom:22px;
white-space:pre-wrap;
">
${field("aboutMe")}
</div>


<h3 style="
color:#1d4ed8;
border-bottom:2px solid #dbeafe;
padding-bottom:6px;
">
Partner Preference
</h3>

<table style="
width:100%;
border-collapse:collapse;
margin-bottom:12px;
">

${row(
"Preferred Age",
field("preferredAge")
)}

${row(
"Preferred State",
field("preferredState")
)}

${row(
"Preferred Disability",
field("preferredDisability")
)}

</table>

<div style="
padding:12px;
background:#f8fafc;
border-radius:10px;
margin-bottom:22px;
white-space:pre-wrap;
">
${field("partnerPreference")}
</div>


<h3 style="
color:#1d4ed8;
border-bottom:2px solid #dbeafe;
padding-bottom:6px;
">
Verification
</h3>

<table style="
width:100%;
border-collapse:collapse;
">

${row(
"Profile Verification",
status("dashboardVerificationStatus")
)}

${row(
"Aadhaar Verification",
status("aadhaarStatus")
)}

${row(
"Face Verification",
status("faceVerificationStatus")
)}

${row(
"Membership",
status("dashboardMembershipStatus")
)}

</table>


<div style="
margin-top:28px;
padding-top:12px;
border-top:1px solid #e5e7eb;
text-align:center;
font-size:12px;
color:#64748b;
">
Generated from DivyangSathi
</div>

`;


/*
PDF generator ko element visible chahiye,
lekin user ko screen par nahi dikhna chahiye.
*/

box.style.position =
"fixed";

box.style.left =
"-10000px";

box.style.top =
"0";

document.body.appendChild(box);


/*
Images/layout ready hone do.
*/

await new Promise(
resolve =>
setTimeout(resolve,300)
);


await html2pdf()

.set({

margin:8,

filename:
"DivyangSathi_"
+
(
name
.replace(
/[^a-z0-9]/gi,
"_"
)
||
"Profile"
)
+
".pdf",

image:{
type:"jpeg",
quality:0.98
},

html2canvas:{
scale:2,
useCORS:true,
allowTaint:false,
backgroundColor:"#ffffff",
logging:false
},

jsPDF:{
unit:"mm",
format:"a4",
orientation:"portrait"
},

pagebreak:{
mode:[
"css",
"legacy"
]
}

})

.from(box)

.save();


box.remove();

}

catch(error){

console.error(
"User PDF Error:",
error
);

alert(
"Profile PDF generate nahi hua."
);

}

}
);

}

// ======================================
// ADMIN DOWNLOAD PROFILE PDF
// ======================================

async function downloadAdminProfilePdf(id){

const card =
event.target.closest(".feature-box");

if(!card){

alert("Profile not found.");

return;

}

html2pdf()

.set({

margin:0.5,

filename:"Profile_"+id+".pdf",

image:{
type:"jpeg",
quality:1
},

html2canvas:{
scale:2
},

jsPDF:{
unit:"in",
format:"a4",
orientation:"portrait"
}

})

.from(card)

.save();

}

// ======================================
// PROFILE INTRO VIDEO UPLOAD
// ======================================

(function () {

if(
!window.location.pathname.includes(
"profile.html"
)
)return;

const videoInput =
document.getElementById(
"introVideoInput"
);

const preview =
document.getElementById(
"introVideoPreview"
);

const uploadButton =
document.getElementById(
"uploadIntroVideoBtn"
);

if(
!videoInput ||
!preview ||
!uploadButton
)return;


// Preview

videoInput.addEventListener(
"change",
function(){

const file =
this.files[0];

if(!file)return;

if(file.size > 50*1024*1024){

alert(
"Maximum video size is 50MB."
);

this.value="";

return;

}

preview.src =
URL.createObjectURL(file);

preview.style.display =
"block";

});


// Upload

uploadButton.addEventListener(
"click",
async function(){

const file =
videoInput.files[0];

if(!file){

alert(
"Please select a video."
);

return;

}

const {
data:{user}
}=await client.auth.getUser();

const extension =
file.name.split(".").pop();

const filePath =
`${user.id}/intro.${extension}`;

uploadButton.disabled=true;

uploadButton.textContent=
"Uploading...";

const {
error:uploadError
}=await client.storage

.from("profile-videos")

.upload(
filePath,
file,
{
upsert:true
}
);

if(uploadError){

alert(
uploadError.message
);

uploadButton.disabled=false;

uploadButton.textContent=
"🎥 Upload Video";

return;

}

const {
data:publicUrl
}=client.storage

.from("profile-videos")

.getPublicUrl(filePath);

await client

.from("profiles")

.update({

intro_video_url:
publicUrl.publicUrl,

intro_video_status:
"pending",

intro_video_uploaded_at:
new Date().toISOString()

})

.eq("id",user.id);

uploadButton.disabled=false;

uploadButton.textContent=
"🎥 Upload Video";

alert(
"Video uploaded successfully. Waiting for admin approval."
);

});

})();

// ======================================
// ADMIN VIDEO APPROVAL
// ======================================

async function approveIntroVideo(profileId) {

  const {
    data: { user }
  } = await client.auth.getUser();

  const { error } = await client
    .from("profiles")
    .update({
      intro_video_status: "approved",
      intro_video_reviewed_at:
        new Date().toISOString(),
      intro_video_reviewed_by:
        user.id
    })
    .eq("id", profileId);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Video approved.");

  loadAdminProfiles();

}


async function rejectIntroVideo(profileId) {

  const {
    data: { user }
  } = await client.auth.getUser();

  const { error } = await client
    .from("profiles")
    .update({
      intro_video_status: "rejected",
      intro_video_reviewed_at:
        new Date().toISOString(),
      intro_video_reviewed_by:
        user.id
    })
    .eq("id", profileId);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Video rejected.");

  loadAdminProfiles();

}

// ======================================
// AUTO CALCULATE AGE FROM DATE OF BIRTH
// ======================================

const dateOfBirthInput =
  document.getElementById("dateOfBirth");

const ageInput =
  document.getElementById("age");

if (dateOfBirthInput && ageInput) {

  dateOfBirthInput.addEventListener(
    "change",
    function () {

      if (!this.value) {
        ageInput.value = "";
        return;
      }

      const birthDate =
        new Date(this.value);

      const today =
        new Date();

      let calculatedAge =
        today.getFullYear() -
        birthDate.getFullYear();

      const monthDifference =
        today.getMonth() -
        birthDate.getMonth();

      if (
        monthDifference < 0 ||
        (
          monthDifference === 0 &&
          today.getDate() <
          birthDate.getDate()
        )
      ) {
        calculatedAge--;
      }

      ageInput.value =
        calculatedAge >= 0
          ? calculatedAge
          : "";

    }
  );

}

// ======================================
// BIRTHDAY WISH
// ======================================

(function () {

  const dob =
    document.getElementById("dateOfBirth")?.value;

  if (!dob) return;

  const today = new Date();
  const birth = new Date(dob);

  if (
    today.getDate() === birth.getDate() &&
    today.getMonth() === birth.getMonth()
  ) {

    setTimeout(() => {

      alert("🎉 Happy Birthday! Team DivyangSathi wishes you a wonderful year ahead.");

    }, 1000);

  }

})();

// ======================================
// DOWNLOAD VIEWED PROFILE PDF
// ======================================

const downloadViewedProfilePdfBtn =
  document.getElementById(
    "downloadViewedProfilePdfBtn"
  );

if (downloadViewedProfilePdfBtn) {

  downloadViewedProfilePdfBtn.addEventListener(
    "click",
    function () {

      const profileContent =
        document.querySelector(
          ".view-profile-main"
        );

      if (!profileContent) {

        alert("Profile content nahi mila.");

        return;

      }

      const profileName =
        document.getElementById(
          "viewName"
        )?.textContent.trim() ||
        "DivyangSathi_Profile";

      html2pdf()
        .set({
          margin: 0.4,
          filename:
            profileName.replace(
              /[^a-zA-Z0-9_-]/g,
              "_"
            ) +
            "_Profile.pdf",

          image: {
            type: "jpeg",
            quality: 1
          },

          html2canvas: {
            scale: 2,
            useCORS: true
          },

          jsPDF: {
            unit: "in",
            format: "a4",
            orientation: "portrait"
          }
        })
        .from(profileContent)
        .save();

    }
  );

}

// ======================================
// VOICE INTRO RECORDER
// ======================================

let voiceRecorder;
let voiceChunks = [];
let voiceBlob = null;

const recordVoiceBtn =
document.getElementById("recordVoiceBtn");

const stopVoiceBtn =
document.getElementById("stopVoiceBtn");

const playVoiceBtn =
document.getElementById("playVoiceBtn");

const uploadVoiceBtn =
document.getElementById("uploadVoiceBtn");

const deleteVoiceBtn =
document.getElementById("deleteVoiceBtn");

const voicePreview =
document.getElementById("voicePreview");

const voiceStatus =
document.getElementById("voiceStatus");

if (recordVoiceBtn) {

recordVoiceBtn.onclick =
async function () {

try {

const stream =
await navigator.mediaDevices.getUserMedia({
audio:true
});

voiceRecorder =
new MediaRecorder(stream);

voiceChunks = [];

voiceRecorder.ondataavailable =
function(e){

voiceChunks.push(e.data);

};

voiceRecorder.onstop =
function(){

voiceBlob =
new Blob(
voiceChunks,
{
type:"audio/webm"
}
);

voicePreview.src =
URL.createObjectURL(
voiceBlob
);

voicePreview.style.display =
"block";

voiceStatus.textContent =
"✅ Voice recorded successfully.";

playVoiceBtn.disabled =
false;

uploadVoiceBtn.disabled =
false;

deleteVoiceBtn.disabled =
false;

};

voiceRecorder.start();

recordVoiceBtn.disabled =
true;

stopVoiceBtn.disabled =
false;

voiceStatus.textContent =
"🎙 Recording...";

setTimeout(function(){

if(
voiceRecorder &&
voiceRecorder.state==="recording"
){

voiceRecorder.stop();

recordVoiceBtn.disabled =
false;

stopVoiceBtn.disabled =
true;

}

},30000);

}catch(error){

alert(
"Microphone permission denied."
);

console.error(error);

}

};

stopVoiceBtn.onclick =
function(){

if(
voiceRecorder &&
voiceRecorder.state==="recording"
){

voiceRecorder.stop();

recordVoiceBtn.disabled =
false;

stopVoiceBtn.disabled =
true;

}

};

playVoiceBtn.onclick =
function(){

voicePreview.play();

};

deleteVoiceBtn.onclick =
function(){

voiceBlob = null;

voicePreview.src = "";

voicePreview.style.display =
"none";

voiceStatus.textContent =
"No voice recorded.";

playVoiceBtn.disabled =
true;

uploadVoiceBtn.disabled =
true;

deleteVoiceBtn.disabled =
true;

};

}

// ======================================
// UPLOAD VOICE INTRO TO SUPABASE
// ======================================

if (uploadVoiceBtn) {

  uploadVoiceBtn.onclick =
  async function () {

    if (!voiceBlob) {

      alert("Pehle voice record karo.");

      return;

    }

    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();

    if (userError || !user) {

      alert("Please login first.");

      return;

    }

    uploadVoiceBtn.disabled = true;
    uploadVoiceBtn.textContent = "Uploading...";

    const filePath =
      `${user.id}/voice-intro.webm`;

    const {
      error: uploadError
    } = await client.storage
      .from("voice-intros")
      .upload(
        filePath,
        voiceBlob,
        {
          contentType: "audio/webm",
          upsert: true
        }
      );

    if (uploadError) {

      uploadVoiceBtn.disabled = false;
      uploadVoiceBtn.textContent = "☁️ Upload";

      alert(uploadError.message);

      return;

    }

    const {
      data: publicUrlData
    } = client.storage
      .from("voice-intros")
      .getPublicUrl(filePath);

    const {
      error: profileError
    } = await client
      .from("profiles")
      .update({
        voice_intro_url:
          publicUrlData.publicUrl,

        voice_intro_status:
          "pending",

        voice_intro_uploaded_at:
          new Date().toISOString()
      })
      .eq("id", user.id);

    uploadVoiceBtn.disabled = false;
    uploadVoiceBtn.textContent = "☁️ Upload";

    if (profileError) {

      alert(profileError.message);

      return;

    }

    voiceStatus.textContent =
      "✅ Voice uploaded. Waiting for admin approval.";

    alert(
      "Voice Intro uploaded successfully."
    );

  };

}

// ======================================
// ADMIN VOICE APPROVE
// ======================================

async function approveVoiceIntro(profileId){

const { error } =
await client
.from("profiles")
.update({
voice_intro_status:"approved"
})
.eq("id",profileId);

if(error){

alert(error.message);
return;

}

alert("✅ Voice Intro Approved");

location.reload();

}

// ======================================
// ADMIN VOICE REJECT
// ======================================

async function rejectVoiceIntro(profileId){

const { error } =
await client
.from("profiles")
.update({
voice_intro_status:"rejected"
})
.eq("id",profileId);

if(error){

alert(error.message);
return;

}

alert("❌ Voice Intro Rejected");

location.reload();

}

const adminVoiceRequestsBtn =
document.getElementById(
"adminVoiceRequestsBtn"
);

if (adminVoiceRequestsBtn) {

adminVoiceRequestsBtn.onclick =
function () {

window.location.href =
"admin-voice.html";

};

}

// ======================================
// ADMIN DASHBOARD - VOICE INTRO REQUESTS
// ======================================

(function () {

  if (
    !(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))
  ) {
    return;
  }

  const container =
    document.getElementById(
      "adminVoiceRequests"
    );

  const searchInput =
    document.getElementById(
      "adminVoiceSearch"
    );

  const refreshButton =
    document.getElementById(
      "refreshAdminVoiceBtn"
    );

  if (!container) {
    return;
  }

  let voiceProfiles = [];


  // ======================================
  // SAFE TEXT
  // ======================================

  function safeVoiceText(value) {

    const div =
      document.createElement("div");

    div.textContent =
      value == null
        ? ""
        : String(value);

    return div.innerHTML;

  }


  // ======================================
  // UPDATE COUNTERS
  // ======================================

  function updateAdminVoiceCounters() {

    const total =
      voiceProfiles.length;

    const pending =
      voiceProfiles.filter(
        profile =>
          profile.voice_intro_status ===
          "pending"
      ).length;

    const approved =
      voiceProfiles.filter(
        profile =>
          profile.voice_intro_status ===
          "approved"
      ).length;

    const rejected =
      voiceProfiles.filter(
        profile =>
          profile.voice_intro_status ===
          "rejected"
      ).length;


    const totalElement =
      document.getElementById(
        "adminVoiceTotalCount"
      );

    const pendingElement =
      document.getElementById(
        "adminVoicePendingCount"
      );

    const approvedElement =
      document.getElementById(
        "adminVoiceApprovedCount"
      );

    const rejectedElement =
      document.getElementById(
        "adminVoiceRejectedCount"
      );

    const pendingBadge =
      document.getElementById(
        "adminVoicePendingBadge"
      );


    if (totalElement) {
      totalElement.textContent =
        total;
    }

    if (pendingElement) {
      pendingElement.textContent =
        pending;
    }

    if (approvedElement) {
      approvedElement.textContent =
        approved;
    }

    if (rejectedElement) {
      rejectedElement.textContent =
        rejected;
    }

    if (pendingBadge) {
      pendingBadge.textContent =
        pending + " Pending";
    }

  }


  // ======================================
  // RENDER VOICE CARDS
  // ======================================

  function renderAdminVoiceRequests(
    profiles
  ) {

    if (!profiles.length) {

      container.innerHTML = `
        <div class="admin-loading-card">

          <h3>
            🎙️ No Voice Requests Found
          </h3>

          <p>
            Kisi member ne abhi Voice Intro upload nahi kiya.
          </p>

        </div>
      `;

      return;

    }

    container.innerHTML = "";

    profiles.forEach(function (profile) {

      const status =
        profile.voice_intro_status ||
        "pending";

      const uploadedDate =
        profile.voice_intro_uploaded_at
          ? new Date(
              profile.voice_intro_uploaded_at
            ).toLocaleString(
              "en-IN"
            )
          : "-";

      const firstLetter =
        (
          profile.full_name ||
          "U"
        )
          .charAt(0)
          .toUpperCase();

      container.innerHTML += `

        <article class="admin-voice-request-card">

          <div class="admin-voice-request-header">

            <div class="admin-voice-request-avatar">

              ${safeVoiceText(
                firstLetter
              )}

            </div>

            <div class="admin-voice-request-user">

              <h3>
                ${safeVoiceText(
                  profile.full_name ||
                  "Unknown Member"
                )}
              </h3>

              <p>
                ${safeVoiceText(
                  profile.email || "-"
                )}
              </p>

            </div>

            <span
              class="
                admin-voice-request-status
                admin-voice-status-${safeVoiceText(
                  status
                )}
              ">

              ${safeVoiceText(
                status
              )}

            </span>

          </div>


          <div class="admin-voice-request-details">

            <p>
              <strong>📱 Mobile:</strong>
              ${safeVoiceText(
                profile.mobile || "-"
              )}
            </p>

            <p>
              <strong>📅 Uploaded:</strong>
              ${safeVoiceText(
                uploadedDate
              )}
            </p>

          </div>


          <audio
            controls
            preload="metadata"
            class="admin-voice-request-player"
            src="${safeVoiceText(
              profile.voice_intro_url
            )}">
          </audio>


          <div class="admin-voice-request-actions">

            <button
              type="button"
              data-voice-action="approve"
              data-profile-id="${profile.id}"
              class="admin-voice-approve-button">

              ✅ Approve

            </button>

            <button
              type="button"
              data-voice-action="reject"
              data-profile-id="${profile.id}"
              class="admin-voice-reject-button">

              ❌ Reject

            </button>

            <button
              type="button"
              data-voice-action="delete"
              data-profile-id="${profile.id}"
              class="admin-voice-delete-button">

              🗑 Delete

            </button>

            <a
              href="view-profile.html?id=${profile.id}"
              class="admin-voice-view-button">

              👤 View Profile

            </a>

          </div>

        </article>

      `;

    });

  }


  // ======================================
  // LOAD REQUESTS
  // ======================================

  async function loadDashboardVoiceRequests() {

    container.innerHTML = `
      <div class="admin-loading-card">

        <div class="admin-loader"></div>

        <p>
          Loading Voice Requests...
        </p>

      </div>
    `;

    if (refreshButton) {

      refreshButton.disabled =
        true;

      refreshButton.textContent =
        "Loading...";

    }

    const {
      data,
      error
    } = await client
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        mobile,
        voice_intro_url,
        voice_intro_status,
        voice_intro_uploaded_at
      `)
      .not(
        "voice_intro_url",
        "is",
        null
      )
      .neq(
        "voice_intro_url",
        ""
      )
      .order(
        "voice_intro_uploaded_at",
        {
          ascending: false
        }
      );

    if (refreshButton) {

      refreshButton.disabled =
        false;

      refreshButton.textContent =
        "🔄 Refresh";

    }

    if (error) {

      console.error(
        "Voice requests error:",
        error
      );

      container.innerHTML = `
        <div class="admin-loading-card">

          <h3>
            Voice Requests load nahi hui
          </h3>

          <p>
            ${safeVoiceText(
              error.message
            )}
          </p>

        </div>
      `;

      return;

    }

    voiceProfiles =
      data || [];

    updateAdminVoiceCounters();

    renderAdminVoiceRequests(
      voiceProfiles
    );

  }


  // ======================================
  // APPROVE / REJECT
  // ======================================

  async function changeVoiceStatus(
    profileId,
    newStatus
  ) {

    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();

    if (
      userError ||
      !user
    ) {

      alert(
        "Admin login required."
      );

      return;

    }

    const {
      error
    } = await client
      .from("profiles")
      .update({
        voice_intro_status:
          newStatus,

        voice_intro_reviewed_at:
          new Date().toISOString(),

        voice_intro_reviewed_by:
          user.id
      })
      .eq(
        "id",
        profileId
      );

    if (error) {

      alert(
        "Status update nahi hua: " +
        error.message
      );

      return;

    }

    alert(
      newStatus === "approved"
        ? "✅ Voice Intro Approved"
        : "❌ Voice Intro Rejected"
    );

    await loadDashboardVoiceRequests();

  }


  // ======================================
  // DELETE VOICE
  // ======================================

  async function deleteDashboardVoice(
    profileId
  ) {

    const confirmed =
      confirm(
        "Kya aap is Voice Intro ko permanently delete karna chahte hain?"
      );

    if (!confirmed) {
      return;
    }

    const profile =
      voiceProfiles.find(
        item =>
          item.id === profileId
      );

    if (!profile) {

      alert(
        "Voice record nahi mila."
      );

      return;

    }


    // Storage file delete

    try {

      const voiceUrl =
        new URL(
          profile.voice_intro_url
        );

      const storageMarker =
        "/voice-intros/";

      const markerPosition =
        voiceUrl.pathname.indexOf(
          storageMarker
        );

      if (
        markerPosition !== -1
      ) {

        const filePath =
          decodeURIComponent(
            voiceUrl.pathname.substring(
              markerPosition +
              storageMarker.length
            )
          );

        const {
          error: storageError
        } = await client.storage
          .from("voice-intros")
          .remove([
            filePath
          ]);

        if (storageError) {

          console.warn(
            "Voice storage delete error:",
            storageError.message
          );

        }

      }

    } catch (storageUrlError) {

      console.warn(
        "Voice URL parse error:",
        storageUrlError
      );

    }


    // Profile columns clear

    const {
      error
    } = await client
      .from("profiles")
      .update({
        voice_intro_url:
          null,

        voice_intro_status:
          "not_uploaded",

        voice_intro_uploaded_at:
          null,

        voice_intro_reviewed_at:
          null,

        voice_intro_reviewed_by:
          null
      })
      .eq(
        "id",
        profileId
      );

    if (error) {

      alert(
        "Voice delete nahi hui: " +
        error.message
      );

      return;

    }

    alert(
      "🗑 Voice Intro Deleted"
    );

    await loadDashboardVoiceRequests();

  }


  // ======================================
  // BUTTON EVENTS
  // ======================================

  container.addEventListener(
    "click",
    async function (event) {

      const button =
        event.target.closest(
          "[data-voice-action]"
        );

      if (!button) {
        return;
      }

      const action =
        button.getAttribute(
          "data-voice-action"
        );

      const profileId =
        button.getAttribute(
          "data-profile-id"
        );

      if (!profileId) {
        return;
      }

      button.disabled = true;

      try {

        if (
          action === "approve"
        ) {

          await changeVoiceStatus(
            profileId,
            "approved"
          );

        } else if (
          action === "reject"
        ) {

          await changeVoiceStatus(
            profileId,
            "rejected"
          );

        } else if (
          action === "delete"
        ) {

          await deleteDashboardVoice(
            profileId
          );

        }

      } finally {

        button.disabled = false;

      }

    }
  );


  // ======================================
  // SEARCH
  // ======================================

  if (searchInput) {

    searchInput.addEventListener(
      "input",
      function () {

        const searchValue =
          this.value
            .trim()
            .toLowerCase();

        const filtered =
          voiceProfiles.filter(
            profile => {

              const combinedText =
                [
                  profile.full_name,
                  profile.email,
                  profile.mobile,
                  profile.voice_intro_status
                ]
                  .join(" ")
                  .toLowerCase();

              return combinedText.includes(
                searchValue
              );

            }
          );

        renderAdminVoiceRequests(
          filtered
        );

      }
    );

  }


  // ======================================
  // REFRESH
  // ======================================

  if (refreshButton) {

    refreshButton.addEventListener(
      "click",
      loadDashboardVoiceRequests
    );

  }


  window.loadDashboardVoiceRequests =
    loadDashboardVoiceRequests;

  loadDashboardVoiceRequests();

})();

// ======================================
// ADMIN ANALYTICS - FINAL
// ======================================

async function loadAdminAnalytics() {

  if (
    !(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))
  ) {
    return;
  }

  const refreshButton =
    document.getElementById(
      "refreshAdminAnalytics"
    );

  if (refreshButton) {
    refreshButton.disabled = true;
    refreshButton.textContent =
      "Loading...";
  }

  const [
    profilesResult,
    interestsResult,
    membershipsResult,
    reportsResult,
    storiesResult,
    messagesResult
  ] = await Promise.all([

    client
      .from("profiles")
      .select("*"),

    client
      .from("interests")
      .select("id"),

    client
      .from("memberships")
      .select("*"),

    client
      .from("user_reports")
      .select("*"),

    client
      .from("success_stories")
      .select("*"),

    client
      .from("messages")
      .select("id")

  ]);


  const results = [
    profilesResult,
    interestsResult,
    membershipsResult,
    reportsResult,
    storiesResult,
    messagesResult
  ];

  const firstError =
    results.find(
      result => result.error
    )?.error;

  if (firstError) {

    console.error(
      "Analytics load error:",
      firstError
    );

    alert(
      "Analytics load nahi hui: " +
      firstError.message
    );

    if (refreshButton) {
      refreshButton.disabled = false;
      refreshButton.textContent =
        "🔄 Refresh Analytics";
    }

    return;

  }


  const profiles =
    profilesResult.data || [];

  const interests =
    interestsResult.data || [];

  const memberships =
    membershipsResult.data || [];

  const reports =
    reportsResult.data || [];

  const stories =
    storiesResult.data || [];

  const messages =
    messagesResult.data || [];


  const today =
    new Date();

  const todayDate =
    today.toISOString().slice(0, 10);

  const currentMonth =
    today.getMonth();

  const currentYear =
    today.getFullYear();


  function setAnalyticsValue(
    elementId,
    value
  ) {

    const element =
      document.getElementById(
        elementId
      );

    if (element) {
      element.textContent =
        String(value);
    }

  }


  const verifiedProfiles =
    profiles.filter(
      profile =>
        profile.verified === true
    );

  const blockedProfiles =
    profiles.filter(
      profile =>
        profile.blocked === true
    );

  const premiumProfiles =
    profiles.filter(
      profile =>
        profile.membership_plan &&
        profile.membership_plan !==
          "Free"
    );

  const todayProfiles =
    profiles.filter(
      profile =>
        profile.created_at &&
        profile.created_at.startsWith(
          todayDate
        )
    );

  const monthProfiles =
    profiles.filter(
      profile => {

        if (!profile.created_at) {
          return false;
        }

        const createdDate =
          new Date(
            profile.created_at
          );

        return (
          createdDate.getMonth() ===
            currentMonth &&
          createdDate.getFullYear() ===
            currentYear
        );

      }
    );

  const pendingVoice =
    profiles.filter(
      profile =>
        profile.voice_intro_status ===
        "pending"
    );

  const pendingVideo =
    profiles.filter(
      profile =>
        profile.intro_video_status ===
        "pending"
    );


  const pendingMemberships =
    memberships.filter(
      membership => {

        const status =
          String(
            membership.status || ""
          ).toLowerCase();

        return status === "pending";

      }
    );


  const pendingReports =
    reports.filter(
      report => {

        const status =
          String(
            report.status || ""
          ).toLowerCase();

        return (
          status === "pending" ||
          status === "open" ||
          !status
        );

      }
    );


  const approvedStories =
    stories.filter(
      story => {

        const status =
          String(
            story.status || ""
          ).toLowerCase();

        return (
          story.approved === true ||
          status === "approved"
        );

      }
    );


  setAnalyticsValue(
    "analyticsTotalUsers",
    profiles.length
  );

  setAnalyticsValue(
    "analyticsVerifiedUsers",
    verifiedProfiles.length
  );

  setAnalyticsValue(
    "analyticsPremiumUsers",
    premiumProfiles.length
  );

  setAnalyticsValue(
    "analyticsBlockedUsers",
    blockedProfiles.length
  );

  setAnalyticsValue(
    "analyticsTodayUsers",
    todayProfiles.length
  );

  setAnalyticsValue(
    "analyticsMonthUsers",
    monthProfiles.length
  );

  setAnalyticsValue(
    "analyticsTotalInterests",
    interests.length
  );

  setAnalyticsValue(
    "analyticsPendingVoice",
    pendingVoice.length
  );

  setAnalyticsValue(
    "analyticsPendingVideo",
    pendingVideo.length
  );

  setAnalyticsValue(
    "analyticsPendingReports",
    pendingReports.length
  );

  setAnalyticsValue(
    "analyticsTotalProfiles",
    profiles.length
  );

  setAnalyticsValue(
    "analyticsPendingMembership",
    pendingMemberships.length
  );

  setAnalyticsValue(
    "analyticsApprovedProfiles",
    verifiedProfiles.length
  );

  setAnalyticsValue(
    "analyticsSuccessStories",
    approvedStories.length
  );

  setAnalyticsValue(
    "analyticsUserReports",
    reports.length
  );

  setAnalyticsValue(
    "analyticsTotalMessages",
    messages.length
  );


  if (refreshButton) {
    refreshButton.disabled = false;
    refreshButton.textContent =
      "🔄 Refresh Analytics";
  }

}

loadAdminAnalytics();


const refreshAdminAnalytics =
  document.getElementById(
    "refreshAdminAnalytics"
  );

if (refreshAdminAnalytics) {

  refreshAdminAnalytics.onclick =
    loadAdminAnalytics;

}

// ======================================
// ADMIN AADHAAR VERIFICATION
// ======================================

(function () {

  if (
    !(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))
  ) {
    return;
  }

  const container =
    document.getElementById(
      "adminAadhaarRequests"
    );

  const searchInput =
    document.getElementById(
      "adminAadhaarSearch"
    );

  const refreshButton =
    document.getElementById(
      "refreshAdminAadhaarBtn"
    );

  if (!container) {
    return;
  }

  let aadhaarProfiles = [];


  function safeAadhaarText(value) {

    const div =
      document.createElement("div");

    div.textContent =
      value == null
        ? ""
        : String(value);

    return div.innerHTML;

  }


  function updateAadhaarCounters() {

    const total =
      aadhaarProfiles.length;

    const pending =
      aadhaarProfiles.filter(
        profile =>
          profile.aadhaar_status ===
          "pending"
      ).length;

    const approved =
      aadhaarProfiles.filter(
        profile =>
          profile.aadhaar_status ===
          "approved"
      ).length;

    const rejected =
      aadhaarProfiles.filter(
        profile =>
          profile.aadhaar_status ===
          "rejected"
      ).length;


    const totalElement =
      document.getElementById(
        "adminAadhaarTotalCount"
      );

    const pendingElement =
      document.getElementById(
        "adminAadhaarPendingCount"
      );

    const approvedElement =
      document.getElementById(
        "adminAadhaarApprovedCount"
      );

    const rejectedElement =
      document.getElementById(
        "adminAadhaarRejectedCount"
      );

    const pendingBadge =
      document.getElementById(
        "adminAadhaarPendingBadge"
      );


    if (totalElement) {
      totalElement.textContent =
        total;
    }

    if (pendingElement) {
      pendingElement.textContent =
        pending;
    }

    if (approvedElement) {
      approvedElement.textContent =
        approved;
    }

    if (rejectedElement) {
      rejectedElement.textContent =
        rejected;
    }

    if (pendingBadge) {
      pendingBadge.textContent =
        pending + " Pending";
    }

  }


  function renderAadhaarRequests(
    profiles
  ) {

    if (!profiles.length) {

      container.innerHTML = `
        <div class="admin-loading-card">

          <h3>
            🪪 No Aadhaar Requests Found
          </h3>

          <p>
            Abhi kisi member ne Aadhaar upload nahi kiya.
          </p>

        </div>
      `;

      return;

    }

    container.innerHTML = "";

    profiles.forEach(function (profile) {

      const status =
        profile.aadhaar_status ||
        "pending";

      const firstLetter =
        (
          profile.full_name ||
          "U"
        )
          .charAt(0)
          .toUpperCase();

      container.innerHTML += `

        <article class="admin-aadhaar-card">

          <div class="admin-aadhaar-card-header">

            <div class="admin-aadhaar-avatar">

              ${safeAadhaarText(
                firstLetter
              )}

            </div>

            <div class="admin-aadhaar-user">

              <h3>
                ${safeAadhaarText(
                  profile.full_name ||
                  "Unknown Member"
                )}
              </h3>

              <p>
                ${safeAadhaarText(
                  profile.email || "-"
                )}
              </p>

            </div>

            <span
              class="
                admin-aadhaar-status
                admin-aadhaar-status-${safeAadhaarText(
                  status
                )}
              ">

              ${safeAadhaarText(
                status
              )}

            </span>

          </div>


          <div class="admin-aadhaar-details">

            <p>
              <strong>📱 Mobile:</strong>
              ${safeAadhaarText(
                profile.mobile || "-"
              )}
            </p>

          </div>


          <div class="admin-aadhaar-images">

            <div class="admin-aadhaar-image-box">

              <span>
                Aadhaar Front
              </span>

              ${
                profile.aadhaar_front_url
                  ? `
                    <a
                      href="${safeAadhaarText(
                        profile.aadhaar_front_url
                      )}"
                      target="_blank"
                      rel="noopener">

                      <img
                        src="${safeAadhaarText(
                          profile.aadhaar_front_url
                        )}"
                        alt="Aadhaar Front">

                    </a>
                  `
                  : `
                    <div>
                      Front image not available
                    </div>
                  `
              }

            </div>


            <div class="admin-aadhaar-image-box">

              <span>
                Aadhaar Back
              </span>

              ${
                profile.aadhaar_back_url
                  ? `
                    <a
                      href="${safeAadhaarText(
                        profile.aadhaar_back_url
                      )}"
                      target="_blank"
                      rel="noopener">

                      <img
                        src="${safeAadhaarText(
                          profile.aadhaar_back_url
                        )}"
                        alt="Aadhaar Back">

                    </a>
                  `
                  : `
                    <div>
                      Back image not available
                    </div>
                  `
              }

            </div>

          </div>


          <div class="admin-aadhaar-actions">

            <button
              type="button"
              data-aadhaar-action="approve"
              data-profile-id="${profile.id}"
              class="admin-aadhaar-approve-btn">

              ✅ Approve

            </button>

            <button
              type="button"
              data-aadhaar-action="reject"
              data-profile-id="${profile.id}"
              class="admin-aadhaar-reject-btn">

              ❌ Reject

            </button>

            <button
              type="button"
              data-aadhaar-action="delete"
              data-profile-id="${profile.id}"
              class="admin-aadhaar-delete-btn">

              🗑 Delete

            </button>

            <a
              href="view-profile.html?id=${profile.id}"
              class="admin-aadhaar-view-btn">

              👤 View Profile

            </a>

          </div>

        </article>

      `;

    });

  }


  async function loadAdminAadhaarRequests() {

    container.innerHTML = `
      <div class="admin-loading-card">

        <div class="admin-loader"></div>

        <p>
          Loading Aadhaar Requests...
        </p>

      </div>
    `;

    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.textContent =
        "Loading...";
    }

    const {
      data,
      error
    } = await client
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        mobile,
        aadhaar_front_url,
        aadhaar_back_url,
        aadhaar_status
      `)
      .or(
        "aadhaar_front_url.not.is.null,aadhaar_back_url.not.is.null"
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );

    if (refreshButton) {
      refreshButton.disabled = false;
      refreshButton.textContent =
        "🔄 Refresh";
    }

    if (error) {

      console.error(
        "Aadhaar requests error:",
        error
      );

      container.innerHTML = `
        <div class="admin-loading-card">

          <h3>
            Aadhaar Requests load nahi hui
          </h3>

          <p>
            ${safeAadhaarText(
              error.message
            )}
          </p>

        </div>
      `;

      return;

    }

    aadhaarProfiles =
      data || [];

    updateAadhaarCounters();

    renderAadhaarRequests(
      aadhaarProfiles
    );

  }


  async function changeAadhaarStatus(
    profileId,
    newStatus
  ) {

    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();

    if (
      userError ||
      !user
    ) {

      alert(
        "Admin login required."
      );

      return;

    }

    const {
      error
    } = await client
      .from("profiles")
      .update({
        aadhaar_status:
          newStatus,

        aadhaar_reviewed_at:
          new Date().toISOString(),

        aadhaar_reviewed_by:
          user.id
      })
      .eq(
        "id",
        profileId
      );

    if (error) {

      alert(
        "Aadhaar status update nahi hua: " +
        error.message
      );

      return;

    }

    alert(
      newStatus === "approved"
        ? "✅ Aadhaar Approved"
        : "❌ Aadhaar Rejected"
    );

    await loadAdminAadhaarRequests();

  }


  async function deleteAadhaarDocuments(
    profileId
  ) {

    const confirmed =
      confirm(
        "Kya aap Aadhaar documents permanently delete karna chahte hain?"
      );

    if (!confirmed) {
      return;
    }

    const profile =
      aadhaarProfiles.find(
        item =>
          item.id === profileId
      );

    if (!profile) {

      alert(
        "Aadhaar record nahi mila."
      );

      return;

    }

    const filePaths = [];

    [
      profile.aadhaar_front_url,
      profile.aadhaar_back_url
    ].forEach(function (fileUrl) {

      if (!fileUrl) {
        return;
      }

      try {

        const parsedUrl =
          new URL(fileUrl);

        const marker =
          "/aadhaar/";

        const markerIndex =
          parsedUrl.pathname.indexOf(
            marker
          );

        if (markerIndex !== -1) {

          filePaths.push(
            decodeURIComponent(
              parsedUrl.pathname.substring(
                markerIndex +
                marker.length
              )
            )
          );

        }

      } catch (error) {

        console.warn(
          "Aadhaar URL parse error:",
          error
        );

      }

    });


    if (filePaths.length) {

      const {
        error: storageError
      } = await client.storage
        .from("aadhaar")
        .remove(filePaths);

      if (storageError) {

        console.warn(
          "Aadhaar storage delete error:",
          storageError.message
        );

      }

    }


    const {
      error
    } = await client
      .from("profiles")
      .update({
        aadhaar_front_url:
          null,

        aadhaar_back_url:
          null,

        aadhaar_status:
          "not_uploaded",

        aadhaar_reviewed_at:
          null,

        aadhaar_reviewed_by:
          null
      })
      .eq(
        "id",
        profileId
      );

    if (error) {

      alert(
        "Aadhaar delete nahi hua: " +
        error.message
      );

      return;

    }

    alert(
      "🗑 Aadhaar Documents Deleted"
    );

    await loadAdminAadhaarRequests();

  }


  container.addEventListener(
    "click",
    async function (event) {

      const button =
        event.target.closest(
          "[data-aadhaar-action]"
        );

      if (!button) {
        return;
      }

      const action =
        button.getAttribute(
          "data-aadhaar-action"
        );

      const profileId =
        button.getAttribute(
          "data-profile-id"
        );

      if (!profileId) {
        return;
      }

      button.disabled = true;

      try {

        if (
          action === "approve"
        ) {

          await changeAadhaarStatus(
            profileId,
            "approved"
          );

        } else if (
          action === "reject"
        ) {

          await changeAadhaarStatus(
            profileId,
            "rejected"
          );

        } else if (
          action === "delete"
        ) {

          await deleteAadhaarDocuments(
            profileId
          );

        }

      } finally {

        button.disabled = false;

      }

    }
  );


  if (searchInput) {

    searchInput.addEventListener(
      "input",
      function () {

        const searchValue =
          this.value
            .trim()
            .toLowerCase();

        const filtered =
          aadhaarProfiles.filter(
            profile => {

              const combinedText =
                [
                  profile.full_name,
                  profile.email,
                  profile.mobile,
                  profile.aadhaar_status
                ]
                  .join(" ")
                  .toLowerCase();

              return combinedText.includes(
                searchValue
              );

            }
          );

        renderAadhaarRequests(
          filtered
        );

      }
    );

  }


  if (refreshButton) {

    refreshButton.addEventListener(
      "click",
      loadAdminAadhaarRequests
    );

  }


  window.loadAdminAadhaarRequests =
    loadAdminAadhaarRequests;

  loadAdminAadhaarRequests();

})();

// ======================================
// FACE PHOTO PREVIEW
// ======================================

const faceVerificationPhoto =
  document.getElementById(
    "faceVerificationPhoto"
  );

const faceVerificationPreview =
  document.getElementById(
    "faceVerificationPreview"
  );

if (
  faceVerificationPhoto &&
  faceVerificationPreview
) {

  faceVerificationPhoto.addEventListener(
    "change",
    function () {

      const file =
        this.files[0];

      if (!file) {
        return;
      }

      faceVerificationPreview.src =
        URL.createObjectURL(file);

      faceVerificationPreview.style.display =
        "block";

    }
  );

}

// ======================================
// ADMIN FACE VERIFICATION
// ======================================

(function () {

  if (
    !(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))
  ) {
    return;
  }

  const container =
    document.getElementById(
      "adminFaceRequests"
    );

  const searchInput =
    document.getElementById(
      "adminFaceSearch"
    );

  const refreshButton =
    document.getElementById(
      "refreshAdminFaceBtn"
    );

  if (!container) {
    return;
  }

  let faceProfiles = [];


  function safeFaceText(value) {

    const div =
      document.createElement("div");

    div.textContent =
      value == null
        ? ""
        : String(value);

    return div.innerHTML;

  }


  function updateFaceCounters() {

    const total =
      faceProfiles.length;

    const pending =
      faceProfiles.filter(
        profile =>
          profile.face_verification_status ===
          "pending"
      ).length;

    const approved =
      faceProfiles.filter(
        profile =>
          profile.face_verification_status ===
          "approved"
      ).length;

    const rejected =
      faceProfiles.filter(
        profile =>
          profile.face_verification_status ===
          "rejected"
      ).length;


    const totalElement =
      document.getElementById(
        "adminFaceTotalCount"
      );

    const pendingElement =
      document.getElementById(
        "adminFacePendingCount"
      );

    const approvedElement =
      document.getElementById(
        "adminFaceApprovedCount"
      );

    const rejectedElement =
      document.getElementById(
        "adminFaceRejectedCount"
      );

    const pendingBadge =
      document.getElementById(
        "adminFacePendingBadge"
      );


    if (totalElement) {
      totalElement.textContent = total;
    }

    if (pendingElement) {
      pendingElement.textContent = pending;
    }

    if (approvedElement) {
      approvedElement.textContent = approved;
    }

    if (rejectedElement) {
      rejectedElement.textContent = rejected;
    }

    if (pendingBadge) {
      pendingBadge.textContent =
        pending + " Pending";
    }

  }


  function renderFaceRequests(
    profiles
  ) {

    if (!profiles.length) {

      container.innerHTML = `
        <div class="admin-loading-card">

          <h3>
            😊 No Face Verification Requests
          </h3>

          <p>
            Abhi kisi member ne selfie upload nahi ki.
          </p>

        </div>
      `;

      return;

    }

    container.innerHTML = "";

    profiles.forEach(function (profile) {

      const status =
        profile.face_verification_status ||
        "pending";

      const firstLetter =
        (
          profile.full_name ||
          "U"
        )
          .charAt(0)
          .toUpperCase();

      container.innerHTML += `

        <article class="admin-face-card">

          <div class="admin-face-card-header">

            <div class="admin-face-avatar">

              ${safeFaceText(
                firstLetter
              )}

            </div>

            <div class="admin-face-user">

              <h3>
                ${safeFaceText(
                  profile.full_name ||
                  "Unknown Member"
                )}
              </h3>

              <p>
                ${safeFaceText(
                  profile.email || "-"
                )}
              </p>

            </div>

            <span
              class="
                admin-face-status
                admin-face-status-${safeFaceText(
                  status
                )}
              ">

              ${safeFaceText(
                status
              )}

            </span>

          </div>


          <div class="admin-face-details">

            <p>
              <strong>📱 Mobile:</strong>
              ${safeFaceText(
                profile.mobile || "-"
              )}
            </p>

          </div>


          <div class="admin-face-image-box">

            ${
              profile.face_photo_url
                ? `
                  <a
                    href="${safeFaceText(
                      profile.face_photo_url
                    )}"
                    target="_blank"
                    rel="noopener">

                    <img
                      src="${safeFaceText(
                        profile.face_photo_url
                      )}"
                      alt="Face Verification Selfie">

                  </a>
                `
                : `
                  <div>
                    Selfie image not available
                  </div>
                `
            }

          </div>


          <div class="admin-face-actions">

            <button
              type="button"
              data-face-action="approve"
              data-profile-id="${profile.id}"
              class="admin-face-approve-btn">

              ✅ Approve

            </button>

            <button
              type="button"
              data-face-action="reject"
              data-profile-id="${profile.id}"
              class="admin-face-reject-btn">

              ❌ Reject

            </button>

            <button
              type="button"
              data-face-action="delete"
              data-profile-id="${profile.id}"
              class="admin-face-delete-btn">

              🗑 Delete

            </button>

            <a
              href="view-profile.html?id=${profile.id}"
              class="admin-face-view-btn">

              👤 View Profile

            </a>

          </div>

        </article>

      `;

    });

  }


  async function loadAdminFaceRequests() {

    container.innerHTML = `
      <div class="admin-loading-card">

        <div class="admin-loader"></div>

        <p>
          Loading Face Verification Requests...
        </p>

      </div>
    `;

    if (refreshButton) {

      refreshButton.disabled = true;
      refreshButton.textContent =
        "Loading...";

    }

    const {
      data,
      error
    } = await client
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        mobile,
        face_photo_url,
        face_verification_status
      `)
      .not(
        "face_photo_url",
        "is",
        null
      )
      .neq(
        "face_photo_url",
        ""
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );

    if (refreshButton) {

      refreshButton.disabled = false;
      refreshButton.textContent =
        "🔄 Refresh";

    }

    if (error) {

      console.error(
        "Face verification error:",
        error
      );

      container.innerHTML = `
        <div class="admin-loading-card">

          <h3>
            Face Requests load nahi hui
          </h3>

          <p>
            ${safeFaceText(
              error.message
            )}
          </p>

        </div>
      `;

      return;

    }

    faceProfiles =
      data || [];

    updateFaceCounters();

    renderFaceRequests(
      faceProfiles
    );

  }


  async function changeFaceStatus(
    profileId,
    newStatus
  ) {

    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();

    if (
      userError ||
      !user
    ) {

      alert(
        "Admin login required."
      );

      return;

    }

    const {
      error
    } = await client
      .from("profiles")
      .update({
        face_verification_status:
          newStatus,

        face_reviewed_at:
          new Date().toISOString(),

        face_reviewed_by:
          user.id
      })
      .eq(
        "id",
        profileId
      );

    if (error) {

      alert(
        "Face status update nahi hua: " +
        error.message
      );

      return;

    }

    alert(
      newStatus === "approved"
        ? "✅ Face Verification Approved"
        : "❌ Face Verification Rejected"
    );

    await loadAdminFaceRequests();

  }


  async function deleteFacePhoto(
    profileId
  ) {

    const confirmed =
      confirm(
        "Kya aap selfie permanently delete karna chahte hain?"
      );

    if (!confirmed) {
      return;
    }

    const profile =
      faceProfiles.find(
        item =>
          item.id === profileId
      );

    if (!profile) {

      alert(
        "Face record nahi mila."
      );

      return;

    }

    if (profile.face_photo_url) {

      try {

        const parsedUrl =
          new URL(
            profile.face_photo_url
          );

        const marker =
          "/face-verification/";

        const markerIndex =
          parsedUrl.pathname.indexOf(
            marker
          );

        if (markerIndex !== -1) {

          const filePath =
            decodeURIComponent(
              parsedUrl.pathname.substring(
                markerIndex +
                marker.length
              )
            );

          await client.storage
            .from("face-verification")
            .remove([
              filePath
            ]);

        }

      } catch (error) {

        console.warn(
          "Face URL parse error:",
          error
        );

      }

    }

    const {
      error
    } = await client
      .from("profiles")
      .update({
        face_photo_url:
          null,

        face_verification_status:
          "not_uploaded",

        face_reviewed_at:
          null,

        face_reviewed_by:
          null
      })
      .eq(
        "id",
        profileId
      );

    if (error) {

      alert(
        "Face photo delete nahi hui: " +
        error.message
      );

      return;

    }

    alert(
      "🗑 Face Verification Photo Deleted"
    );

    await loadAdminFaceRequests();

  }


  container.addEventListener(
    "click",
    async function (event) {

      const button =
        event.target.closest(
          "[data-face-action]"
        );

      if (!button) {
        return;
      }

      const action =
        button.getAttribute(
          "data-face-action"
        );

      const profileId =
        button.getAttribute(
          "data-profile-id"
        );

      if (!profileId) {
        return;
      }

      button.disabled = true;

      try {

        if (
          action === "approve"
        ) {

          await changeFaceStatus(
            profileId,
            "approved"
          );

        } else if (
          action === "reject"
        ) {

          await changeFaceStatus(
            profileId,
            "rejected"
          );

        } else if (
          action === "delete"
        ) {

          await deleteFacePhoto(
            profileId
          );

        }

      } finally {

        button.disabled = false;

      }

    }
  );


  if (searchInput) {

    searchInput.addEventListener(
      "input",
      function () {

        const searchValue =
          this.value
            .trim()
            .toLowerCase();

        const filtered =
          faceProfiles.filter(
            profile => {

              const combinedText =
                [
                  profile.full_name,
                  profile.email,
                  profile.mobile,
                  profile.face_verification_status
                ]
                  .join(" ")
                  .toLowerCase();

              return combinedText.includes(
                searchValue
              );

            }
          );

        renderFaceRequests(
          filtered
        );

      }
    );

  }


  if (refreshButton) {

    refreshButton.addEventListener(
      "click",
      loadAdminFaceRequests
    );

  }


  window.loadAdminFaceRequests =
    loadAdminFaceRequests;

  loadAdminFaceRequests();

})();

// ======================================
// ADMIN REPORTS MANAGEMENT - PART 1
// LOAD DATA + COUNTERS + SEARCH
// ======================================

(function () {

  if (
    !(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))
  ) {
    return;
  }

  const reportsContainer =
    document.getElementById(
      "adminReportsList"
    );

  const reportsSearch =
    document.getElementById(
      "adminReportSearch"
    );

  const reportsRefreshButton =
    document.getElementById(
      "refreshReportsBtn"
    );

  if (!reportsContainer) {
    return;
  }


  // Parts 2, 3 and 4 isi object ko use karenge.

  window.adminReportsManager = {

    reports: [],

    profiles: [],

    filteredReports: [],


    safeText(value) {

      const div =
        document.createElement("div");

      div.textContent =
        value == null
          ? ""
          : String(value);

      return div.innerHTML;

    },


    getProfile(profileId) {

      return this.profiles.find(
        profile =>
          String(profile.id) ===
          String(profileId)
      ) || null;

    },


    getReportStatus(report) {

      return String(
        report.status ||
        "pending"
      ).toLowerCase();

    },


    updateCounters() {

      const total =
        this.reports.length;

      const pending =
        this.reports.filter(
          report => {

            const status =
              this.getReportStatus(
                report
              );

            return (
              status === "pending" ||
              status === "open"
            );

          }
        ).length;

      const resolved =
        this.reports.filter(
          report =>
            this.getReportStatus(
              report
            ) === "resolved"
        ).length;

      const rejected =
        this.reports.filter(
          report =>
            this.getReportStatus(
              report
            ) === "rejected"
        ).length;


      const totalElement =
        document.getElementById(
          "adminReportsTotal"
        );

      const pendingElement =
        document.getElementById(
          "adminReportsPending"
        );

      const resolvedElement =
        document.getElementById(
          "adminReportsResolved"
        );

      const rejectedElement =
        document.getElementById(
          "adminReportsRejected"
        );

      const pendingBadge =
        document.getElementById(
          "adminReportsPendingBadge"
        );


      if (totalElement) {
        totalElement.textContent =
          total;
      }

      if (pendingElement) {
        pendingElement.textContent =
          pending;
      }

      if (resolvedElement) {
        resolvedElement.textContent =
          resolved;
      }

      if (rejectedElement) {
        rejectedElement.textContent =
          rejected;
      }

      if (pendingBadge) {
        pendingBadge.textContent =
          pending + " Pending";
      }

    },


    applySearch() {

      const searchValue =
        reportsSearch
          ? reportsSearch.value
              .trim()
              .toLowerCase()
          : "";

      if (!searchValue) {

        this.filteredReports =
          [...this.reports];

      } else {

        this.filteredReports =
          this.reports.filter(
            report => {

              const reporterId =
                report.reporter_id ||
                report.user_id ||
                report.created_by;

              const reportedUserId =
                report.reported_user_id ||
                report.reported_profile_id ||
                report.target_user_id;

              const reporter =
                this.getProfile(
                  reporterId
                );

              const reportedUser =
                this.getProfile(
                  reportedUserId
                );

              const combinedText = [

                reporter?.full_name,
                reporter?.email,
                reporter?.mobile,

                reportedUser?.full_name,
                reportedUser?.email,
                reportedUser?.mobile,

                report.reason,
                report.description,
                report.details,
                report.status

              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

              return combinedText.includes(
                searchValue
              );

            }
          );

      }


      // Part 2 me ye function banega.

      if (
        typeof this.renderReports ===
        "function"
      ) {

        this.renderReports(
          this.filteredReports
        );

      }

    },


    async loadReports() {

      reportsContainer.innerHTML = `
        <div class="admin-loading-card">

          <div class="admin-loader"></div>

          <p>
            Loading Reports...
          </p>

        </div>
      `;


      if (reportsRefreshButton) {

        reportsRefreshButton.disabled =
          true;

        reportsRefreshButton.textContent =
          "Loading...";

      }


      const [
        reportsResult,
        profilesResult
      ] = await Promise.all([

        client
          .from("user_reports")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false
            }
          ),

        client
          .from("profiles")
          .select(`
            id,
            full_name,
            email,
            mobile,
            blocked,
            verified
          `)

      ]);


      if (reportsRefreshButton) {

        reportsRefreshButton.disabled =
          false;

        reportsRefreshButton.textContent =
          "🔄 Refresh";

      }


      if (reportsResult.error) {

        console.error(
          "Reports load error:",
          reportsResult.error
        );

        reportsContainer.innerHTML = `
          <div class="admin-loading-card">

            <h3>
              Reports load nahi hui
            </h3>

            <p>
              ${this.safeText(
                reportsResult.error.message
              )}
            </p>

          </div>
        `;

        return;

      }


      if (profilesResult.error) {

        console.error(
          "Report profiles error:",
          profilesResult.error
        );

      }


      this.reports =
        reportsResult.data || [];

      this.profiles =
        profilesResult.data || [];

      this.filteredReports =
        [...this.reports];


      this.updateCounters();


      // Part 2 paste hone ke baad cards render honge.

      if (
        typeof this.renderReports ===
        "function"
      ) {

        this.renderReports(
          this.filteredReports
        );

      } else {

        reportsContainer.innerHTML = `
          <div class="admin-loading-card">

            <h3>
              Reports Loaded
            </h3>

            <p>
              Total ${this.reports.length}
              reports found.
              Part 2 add karne ke baad cards dikhenge.
            </p>

          </div>
        `;

      }

    }

  };


  if (reportsSearch) {

    reportsSearch.addEventListener(
      "input",
      function () {

        window.adminReportsManager
          .applySearch();

      }
    );

  }


  if (reportsRefreshButton) {

    reportsRefreshButton.addEventListener(
      "click",
      function () {

        window.adminReportsManager
          .loadReports();

      }
    );

  }


  window.adminReportsManager
    .loadReports();

})();

// ======================================
// ADMIN REPORTS MANAGEMENT - PART 2
// REPORT CARDS
// ======================================

if (window.adminReportsManager) {

  window.adminReportsManager.renderReports =
    function (reports) {

      const container =
        document.getElementById(
          "adminReportsList"
        );

      if (!container) {
        return;
      }

      if (!reports || reports.length === 0) {

        container.innerHTML = `
          <div class="admin-loading-card">

            <h3>
              🚩 No Reports Found
            </h3>

            <p>
              Koi report available nahi hai.
            </p>

          </div>
        `;

        return;

      }

      container.innerHTML = "";

      reports.forEach(report => {

        const reporterId =
          report.reporter_id ||
          report.user_id ||
          report.created_by;

        const reportedUserId =
          report.reported_user_id ||
          report.reported_profile_id ||
          report.target_user_id;

        const reporter =
          this.getProfile(
            reporterId
          );

        const reportedUser =
          this.getProfile(
            reportedUserId
          );

        const status =
          this.getReportStatus(
            report
          );

        const reason =
          report.reason ||
          report.description ||
          report.details ||
          "No reason provided.";

        const reportDate =
          report.created_at
            ? new Date(
                report.created_at
              ).toLocaleString(
                "en-IN"
              )
            : "-";

        const reporterName =
          reporter?.full_name ||
          "Unknown Reporter";

        const reportedName =
          reportedUser?.full_name ||
          "Unknown User";

        const firstLetter =
          reportedName
            .charAt(0)
            .toUpperCase();

        container.innerHTML += `

          <article class="admin-report-card">

            <div class="admin-report-card-header">

              <div class="admin-report-avatar">

                ${this.safeText(
                  firstLetter
                )}

              </div>

              <div class="admin-report-user">

                <h3>
                  ${this.safeText(
                    reportedName
                  )}
                </h3>

                <p>
                  Report ID:
                  ${this.safeText(
                    report.id || "-"
                  )}
                </p>

              </div>

              <span
                class="
                  admin-report-status
                  admin-report-status-${this.safeText(
                    status
                  )}
                ">

                ${this.safeText(
                  status
                )}

              </span>

            </div>


            <div class="admin-report-details">

              <p>
                <strong>
                  👤 Reporter:
                </strong>

                ${this.safeText(
                  reporterName
                )}
              </p>

              <p>
                <strong>
                  📧 Reporter Email:
                </strong>

                ${this.safeText(
                  reporter?.email || "-"
                )}
              </p>

              <p>
                <strong>
                  👤 Reported User:
                </strong>

                ${this.safeText(
                  reportedName
                )}
              </p>

              <p>
                <strong>
                  📧 Reported Email:
                </strong>

                ${this.safeText(
                  reportedUser?.email || "-"
                )}
              </p>

              <p>
                <strong>
                  📱 Reported Mobile:
                </strong>

                ${this.safeText(
                  reportedUser?.mobile || "-"
                )}
              </p>

              <p>
                <strong>
                  📅 Report Date:
                </strong>

                ${this.safeText(
                  reportDate
                )}
              </p>

            </div>


            <div class="admin-report-reason">

              <strong>
                📝 Report Reason
              </strong>

              <p>
                ${this.safeText(
                  reason
                )}
              </p>

            </div>


            <div class="admin-report-actions">

              ${
                reportedUserId
                  ? `
                    <a
                      href="view-profile.html?id=${encodeURIComponent(
                        reportedUserId
                      )}"
                      class="admin-report-view-btn">

                      👁️ View Profile

                    </a>
                  `
                  : ""
              }

              ${
                reportedUserId
                  ? `
                    <button
                      type="button"
                      data-report-action="block"
                      data-report-id="${this.safeText(
                        report.id
                      )}"
                      data-user-id="${this.safeText(
                        reportedUserId
                      )}"
                      class="admin-report-block-btn">

                      ${
                        reportedUser?.blocked
                          ? "🚫 User Blocked"
                          : "🚫 Block User"
                      }

                    </button>
                  `
                  : ""
              }

              <button
                type="button"
                data-report-action="resolve"
                data-report-id="${this.safeText(
                  report.id
                )}"
                class="admin-report-resolve-btn">

                ✅ Resolve

              </button>

              <button
                type="button"
                data-report-action="reject"
                data-report-id="${this.safeText(
                  report.id
                )}"
                class="admin-report-reject-btn">

                ❌ Reject

              </button>

              <button
                type="button"
                data-report-action="delete"
                data-report-id="${this.safeText(
                  report.id
                )}"
                class="admin-report-delete-btn">

                🗑️ Delete

              </button>

            </div>

          </article>

        `;

      });

    };


  window.adminReportsManager.renderReports(
    window.adminReportsManager.filteredReports
  );

}
// ======================================
// ADMIN REPORTS MANAGEMENT - PART 3
// RESOLVE / REJECT / DELETE / BLOCK
// ======================================

if (window.adminReportsManager) {

  window.adminReportsManager.updateReportStatus =
    async function (
      reportId,
      newStatus
    ) {

      const { error } =
        await client
          .from("user_reports")
          .update({
            status: newStatus
          })
          .eq(
            "id",
            reportId
          );

      if (error) {

        alert(
          "Report update nahi hui: " +
          error.message
        );

        return false;

      }

      alert(
        newStatus === "resolved"
          ? "✅ Report Resolved"
          : "❌ Report Rejected"
      );

      await this.loadReports();

      return true;

    };


  window.adminReportsManager.deleteReport =
    async function (reportId) {

      const confirmed =
        confirm(
          "Kya aap is report ko permanently delete karna chahte hain?"
        );

      if (!confirmed) {
        return false;
      }

      const { error } =
        await client
          .from("user_reports")
          .delete()
          .eq(
            "id",
            reportId
          );

      if (error) {

        alert(
          "Report delete nahi hui: " +
          error.message
        );

        return false;

      }

      alert(
        "🗑️ Report Deleted"
      );

      await this.loadReports();

      return true;

    };


  window.adminReportsManager.blockReportedUser =
    async function (userId) {

      const confirmed =
        confirm(
          "Kya aap reported user ko block karna chahte hain?"
        );

      if (!confirmed) {
        return false;
      }

      const { error } =
        await client
          .from("profiles")
          .update({
            blocked: true
          })
          .eq(
            "id",
            userId
          );

      if (error) {

        alert(
          "User block nahi hua: " +
          error.message
        );

        return false;

      }

      alert(
        "🚫 User Blocked"
      );

      await this.loadReports();

      return true;

    };


  const reportsContainer =
    document.getElementById(
      "adminReportsList"
    );

  if (reportsContainer) {

    reportsContainer.addEventListener(
      "click",
      async function (event) {

        const button =
          event.target.closest(
            "[data-report-action]"
          );

        if (!button) {
          return;
        }

        const action =
          button.getAttribute(
            "data-report-action"
          );

        const reportId =
          button.getAttribute(
            "data-report-id"
          );

        const userId =
          button.getAttribute(
            "data-user-id"
          );

        if (!reportId) {
          return;
        }

        button.disabled = true;

        try {

          if (
            action === "resolve"
          ) {

            await window
              .adminReportsManager
              .updateReportStatus(
                reportId,
                "resolved"
              );

          } else if (
            action === "reject"
          ) {

            await window
              .adminReportsManager
              .updateReportStatus(
                reportId,
                "rejected"
              );

          } else if (
            action === "delete"
          ) {

            await window
              .adminReportsManager
              .deleteReport(
                reportId
              );

          } else if (
            action === "block" &&
            userId
          ) {

            await window
              .adminReportsManager
              .blockReportedUser(
                userId
              );

          }

        } finally {

          button.disabled = false;

        }

      }
    );

  }

}
// ======================================
// ADMIN REPORTS MANAGEMENT - PART 4
// FINAL INIT
// ======================================

if (window.adminReportsManager) {

  // Initial load
  window.adminReportsManager.loadReports();

  // Global refresh (optional)
  window.loadAdminReports =
    function () {

      return window
        .adminReportsManager
        .loadReports();

    };

  console.log(
    "✅ Admin Reports Management Loaded"
  );

}

// ======================================
// MONTHLY REGISTRATIONS CHART
// ======================================

let monthlyRegistrationsChart = null;

async function loadMonthlyRegistrationsChart() {

  if (
    !(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))
  ) return;

  const canvas =
    document.getElementById(
      "monthlyRegistrationsChart"
    );

  if (!canvas) return;

  const { data, error } = await client
    .from("profiles")
    .select("created_at");

  if (error) {

    console.error(error);

    return;

  }

  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  const counts =
    new Array(12).fill(0);

  (data || []).forEach(profile => {

    if (!profile.created_at) return;

    const month =
      new Date(profile.created_at)
        .getMonth();

    counts[month]++;

  });

  if (monthlyRegistrationsChart) {

    monthlyRegistrationsChart.destroy();

  }

  monthlyRegistrationsChart =
    new Chart(
      canvas,
      {

        type: "bar",

        data: {

          labels: months,

          datasets: [

            {

              label:
                "Registrations",

              data: counts,

              borderWidth: 1,

              borderRadius: 8

            }

          ]

        },

        options: {

          responsive: true,

          maintainAspectRatio: false,

          plugins: {

            legend: {

              display: false

            }

          },

          scales: {

            y: {

              beginAtZero: true

            }

          }

        }

      }

    );

}

loadMonthlyRegistrationsChart();

// ======================================
// GENDER DISTRIBUTION CHART
// ======================================

let genderDistributionChart = null;

async function loadGenderDistributionChart() {

  if (
    !(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))
  ) return;

  const canvas =
    document.getElementById(
      "genderDistributionChart"
    );

  if (!canvas) return;

  const { data, error } = await client
    .from("profiles")
    .select("gender");

  if (error) {

    console.error(error);

    return;

  }

  let male = 0;
  let female = 0;
  let other = 0;

  (data || []).forEach(profile => {

    const gender =
      String(
        profile.gender || ""
      ).toLowerCase();

    if (gender === "male") {

      male++;

    } else if (gender === "female") {

      female++;

    } else {

      other++;

    }

  });

  if (genderDistributionChart) {

    genderDistributionChart.destroy();

  }

  genderDistributionChart =
    new Chart(
      canvas,
      {

        type: "pie",

        data: {

          labels: [
            "Male",
            "Female",
            "Other"
          ],

          datasets: [

            {

              data: [
                male,
                female,
                other
              ]

            }

          ]

        },

        options: {

          responsive: true,

          maintainAspectRatio: false

        }

      }

    );

}

loadGenderDistributionChart();

// ======================================
// MEMBERSHIP DISTRIBUTION CHART
// ======================================

let membershipDistributionChart = null;

async function loadMembershipDistributionChart() {

  if (
    !(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))
  ) return;

  const canvas =
    document.getElementById(
      "membershipDistributionChart"
    );

  if (!canvas) return;

  const { data, error } = await client
    .from("profiles")
    .select("membership_plan");

  if (error) {

    console.error(
      "Membership chart error:",
      error
    );

    return;

  }

  const membershipCounts = {};

  (data || []).forEach(profile => {

    const plan =
      String(
        profile.membership_plan ||
        "Free"
      ).trim() || "Free";

    membershipCounts[plan] =
      (membershipCounts[plan] || 0) + 1;

  });

  const labels =
    Object.keys(membershipCounts);

  const counts =
    Object.values(membershipCounts);

  if (membershipDistributionChart) {

    membershipDistributionChart.destroy();

  }

  membershipDistributionChart =
    new Chart(
      canvas,
      {

        type: "doughnut",

        data: {

          labels: labels,

          datasets: [
            {
              data: counts,
              borderWidth: 2
            }
          ]

        },

        options: {

          responsive: true,

          maintainAspectRatio: false,

          cutout: "60%",

          plugins: {

            legend: {
              position: "bottom"
            }

          }

        }

      }
    );

}

loadMembershipDistributionChart();

// ======================================
// PROFILE VERIFICATION STATUS CHART
// ======================================

let verificationStatusChart = null;

async function loadVerificationStatusChart() {

  if (
    !(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))
  ) return;

  const canvas =
    document.getElementById(
      "verificationStatusChart"
    );

  if (!canvas) return;

  const { data, error } = await client
    .from("profiles")
    .select("verified");

  if (error) {

    console.error(error);

    return;

  }

  let verified = 0;
  let pending = 0;

  (data || []).forEach(profile => {

    if (profile.verified === true) {

      verified++;

    } else {

      pending++;

    }

  });

  if (verificationStatusChart) {

    verificationStatusChart.destroy();

  }

  verificationStatusChart =
    new Chart(
      canvas,
      {

        type: "doughnut",

        data: {

          labels: [
            "Verified",
            "Pending"
          ],

          datasets: [

            {

              data: [
                verified,
                pending
              ],

              borderWidth: 2

            }

          ]

        },

        options: {

          responsive: true,

          maintainAspectRatio: false,

          cutout: "60%",

          plugins: {

            legend: {

              position: "bottom"

            }

          }

        }

      }

    );

}

loadVerificationStatusChart();

// ======================================
// ADVANCED LIVE ANALYTICS
// ======================================

async function loadAdvancedAnalytics() {

  const analyticsPage =
    (window.location.pathname.split("/").pop() || "") === "admin.html";

  if (!analyticsPage) return;

  const [
    profilesResult,
    messagesResult,
    interestsResult,
    favouritesResult,
    membershipsResult,
    reportsResult,
    storiesResult,
    contactsResult,
    viewsResult
  ] = await Promise.all([

    client.from("profiles").select("id,created_at,last_active"),

    client.from("messages").select("id"),

    client.from("interests").select("id"),

    client.from("favourites").select("id"),

    client.from("memberships").select("id,payment_status"),

    client.from("user_reports").select("id"),

    client.from("success_stories").select("id"),

    client.from("contact_messages").select("id"),

    client.from("profile_views").select("id")

  ]);


  const profiles =
    profilesResult.data || [];

  const today =
    new Date();

  const month =
    today.getMonth();

  const year =
    today.getFullYear();

  const activeLimit =
    new Date();

  activeLimit.setDate(
    activeLimit.getDate() - 30
  );

  let activeUsers = 0;
  let todayUsers = 0;
  let monthUsers = 0;

  profiles.forEach(profile => {

    if (profile.last_active) {

      if (
        new Date(profile.last_active) >=
        activeLimit
      ) {

        activeUsers++;

      }

    }

    if (profile.created_at) {

      const date =
        new Date(profile.created_at);

      if (
        date.toDateString() ===
        today.toDateString()
      ) {

        todayUsers++;

      }

      if (
        date.getMonth() === month &&
        date.getFullYear() === year
      ) {

        monthUsers++;

      }

    }

  });


  document.getElementById(
    "analyticsTotalUsers"
  ).textContent =
    profiles.length;

  document.getElementById(
    "analyticsActiveUsers"
  ).textContent =
    activeUsers;

  document.getElementById(
    "analyticsTodayUsers"
  ).textContent =
    todayUsers;

  document.getElementById(
    "analyticsMonthUsers"
  ).textContent =
    monthUsers;

  document.getElementById(
    "analyticsMessages"
  ).textContent =
    messagesResult.data?.length || 0;

  document.getElementById(
    "analyticsInterests"
  ).textContent =
    interestsResult.data?.length || 0;

  document.getElementById(
    "analyticsViews"
  ).textContent =
    viewsResult.data?.length || 0;

  document.getElementById(
    "analyticsFavourites"
  ).textContent =
    favouritesResult.data?.length || 0;

  document.getElementById(
    "analyticsMemberships"
  ).textContent =
    membershipsResult.data?.length || 0;

  document.getElementById(
    "analyticsReports"
  ).textContent =
    reportsResult.data?.length || 0;

  document.getElementById(
    "analyticsStories"
  ).textContent =
    storiesResult.data?.length || 0;

  document.getElementById(
    "analyticsContacts"
  ).textContent =
    contactsResult.data?.length || 0;

}

loadAdvancedAnalytics();

// ======================================
// AUTO REFRESH ANALYTICS
// ======================================

setInterval(() => {

  if (
    (window.location.pathname.split("/").pop() || "") === "admin.html"
  ) {

    loadAdvancedAnalytics();

    loadMonthlyRegistrationsChart();

    loadGenderDistributionChart();

    loadMembershipDistributionChart();

    loadVerificationStatusChart();

  }

}, 30000);

// ======================================
// ANIMATED COUNTERS
// ======================================

function animateCounter(id, value) {

  const el =
    document.getElementById(id);

  if (!el) return;

  const start =
    Number(el.textContent) || 0;

  const duration = 800;

  const startTime =
    performance.now();

  function step(time) {

    const progress =
      Math.min(
        (time - startTime) /
          duration,
        1
      );

    el.textContent =
      Math.floor(
        start +
        (value - start) *
        progress
      );

    if (progress < 1) {

      requestAnimationFrame(
        step
      );

    }

  }

  requestAnimationFrame(step);

}

// ======================================
// STATE-WISE USERS CHART
// ======================================

let stateWiseUsersChart = null;

async function loadStateWiseUsersChart() {

  if (
    !(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))
  ) {
    return;
  }

  const canvas =
    document.getElementById(
      "stateWiseUsersChart"
    );

  if (!canvas) {
    return;
  }

  const {
    data,
    error
  } = await client
    .from("profiles")
    .select("state");

  if (error) {

    console.error(
      "State chart error:",
      error
    );

    return;

  }

  const stateCounts = {};

  (data || []).forEach(function (profile) {

    const state =
      String(
        profile.state ||
        "Not Specified"
      ).trim();

    const stateName =
      state || "Not Specified";

    stateCounts[stateName] =
      (stateCounts[stateName] || 0) + 1;

  });

  const sortedStates =
    Object.entries(stateCounts)
      .sort(function (a, b) {

        return b[1] - a[1];

      })
      .slice(0, 15);

  const labels =
    sortedStates.map(
      item => item[0]
    );

  const counts =
    sortedStates.map(
      item => item[1]
    );

  if (stateWiseUsersChart) {

    stateWiseUsersChart.destroy();

  }

  stateWiseUsersChart =
    new Chart(
      canvas,
      {

        type: "bar",

        data: {

          labels: labels,

          datasets: [
            {
              label: "Users",
              data: counts,
              borderWidth: 1,
              borderRadius: 7
            }
          ]

        },

        options: {

          indexAxis: "y",

          responsive: true,

          maintainAspectRatio: false,

          plugins: {

            legend: {
              display: false
            }

          },

          scales: {

            x: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }

          }

        }

      }
    );

}

loadStateWiseUsersChart();



// ======================================
// ADMIN DASHBOARD V3 SHELL
// ======================================
(function () {
  if (!(window.location.pathname.includes("admin") && !window.location.pathname.includes("admin-login"))) return;

  function initAdminV3Shell() {
    const sidebar = document.getElementById("adminV3Sidebar");
    const toggle = document.getElementById("adminV3SidebarToggle");
    const backdrop = document.getElementById("adminV3SidebarBackdrop");
    if (!sidebar) return;

    function closeSidebar() {
      sidebar.classList.remove("is-open");
      backdrop?.classList.remove("is-visible");
      document.body.classList.remove("admin-v3-menu-open");
    }
    function openSidebar() {
      sidebar.classList.add("is-open");
      backdrop?.classList.add("is-visible");
      document.body.classList.add("admin-v3-menu-open");
    }

    if (toggle && toggle.dataset.v3Connected !== "true") {
      toggle.dataset.v3Connected = "true";
      toggle.addEventListener("click", function () {
        sidebar.classList.contains("is-open") ? closeSidebar() : openSidebar();
      });
    }
    backdrop?.addEventListener("click", closeSidebar);

    const links = Array.from(sidebar.querySelectorAll('a[href^="#"]'));
    links.forEach(function (link) {
      link.addEventListener("click", function (event) {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        links.forEach(item => item.classList.remove("active"));
        link.classList.add("active");
        if (window.innerWidth <= 1100) closeSidebar();
      });
    });

    const sections = links.map(link => document.querySelector(link.getAttribute("href"))).filter(Boolean);
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const active = links.find(link => link.getAttribute("href") === "#" + entry.target.id);
          if (active) {
            links.forEach(item => item.classList.remove("active"));
            active.classList.add("active");
          }
        });
      }, { rootMargin: "-22% 0px -65% 0px", threshold: 0.01 });
      sections.forEach(section => observer.observe(section));
    }

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1100) closeSidebar();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
  initAdminV3Shell();
  loadPendingPayments();
});
  document.addEventListener("divyangsathi:layout-ready", initAdminV3Shell);
  if (document.readyState !== "loading") initAdminV3Shell();
})();


// =====================================================
// FINAL ADMIN TOPBAR OVERRIDE
// DARK MODE + NOTIFICATION BELL
// =====================================================
(function () {
  "use strict";

  function isAdminPage() {
    const p = location.pathname.split("/").pop() || "";
    return p.startsWith("admin") && p !== "admin-login.html";
  }

  if (!isAdminPage()) return;

  // -----------------------------------------------
  // DARK MODE RESTORE
  // -----------------------------------------------
  function restoreAdminDarkMode() {
    const saved =
      localStorage.getItem("divyangsathi-admin-theme") ||
      localStorage.getItem("adminTheme") ||
      "light";

    if (saved === "dark") {
      document.body.classList.add("admin-dark-mode");
    } else {
      document.body.classList.remove("admin-dark-mode");
    }

    updateDarkButton();
  }

  function updateDarkButton() {
    const btn = document.getElementById("adminDarkModeToggle");
    if (!btn) return;

    const dark =
      document.body.classList.contains("admin-dark-mode");

    btn.innerHTML = dark
      ? "☀️ <span>Light</span>"
      : "🌙 <span>Dark</span>";
  }

  // -----------------------------------------------
  // NOTIFICATION PANEL
  // -----------------------------------------------
  function getAdminNotificationPanel() {
    let panel =
      document.getElementById("dsFinalAdminNotificationPanel");

    if (panel) return panel;

    panel = document.createElement("div");

    panel.id = "dsFinalAdminNotificationPanel";

    panel.style.cssText = `
      display:none;
      position:fixed;
      top:78px;
      right:20px;
      width:min(390px,calc(100vw - 30px));
      max-height:70vh;
      overflow-y:auto;
      background:#ffffff;
      color:#0f172a;
      border:1px solid #e2e8f0;
      border-radius:16px;
      box-shadow:0 22px 55px rgba(15,23,42,.25);
      z-index:999999;
    `;

    document.body.appendChild(panel);

    return panel;
  }

  function escapeAdminNotice(value) {
    const d = document.createElement("div");
    d.textContent = value || "";
    return d.innerHTML;
  }

  async function loadFinalAdminNotifications() {
    const panel = getAdminNotificationPanel();

    const count =
      document.getElementById("adminNotificationCount");

    panel.innerHTML = `
      <div style="padding:18px;">
        Loading notifications...
      </div>
    `;

    try {
      const {
        data: { user },
        error: userError
      } = await client.auth.getUser();

      if (userError || !user) {
        if (count) count.textContent = "0";

        panel.innerHTML = `
          <div style="padding:18px;">
            Admin login required.
          </div>
        `;

        return;
      }

      const {
        data: admin,
        error: adminError
      } = await client
        .from("admins")
        .select("id, active")
        .eq("id", user.id)
        .maybeSingle();

      if (
        adminError ||
        !admin ||
        admin.active !== true
      ) {
        if (count) count.textContent = "0";

        panel.innerHTML = `
          <div style="padding:18px;">
            Admin access denied.
          </div>
        `;

        return;
      }

      const {
        data,
        error
      } = await client
        .from("admin_notifications")
        .select(`
          id,
          type,
          title,
          message,
          is_read,
          created_at
        `)
        .order("created_at", {
          ascending: false
        })
        .limit(50);

      if (error) throw error;

      const rows = data || [];

      const unread =
        rows.filter(
          item => item.is_read !== true
        ).length;

      if (count) {
        count.textContent = String(unread);
      }

      panel.innerHTML = `
        <div style="
          padding:14px 16px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          border-bottom:1px solid #e2e8f0;
          position:sticky;
          top:0;
          background:#ffffff;
          z-index:2;
        ">
          <strong>🔔 Admin Notifications</strong>

          <button
            type="button"
            id="dsFinalMarkAllRead"
            style="
              border:0;
              background:transparent;
              color:#2563eb;
              font-weight:700;
              cursor:pointer;
            ">
            Mark All Read
          </button>
        </div>

        ${
          rows.length
            ? rows.map(item => `
              <div
                data-ds-admin-notification="${escapeAdminNotice(item.id)}"
                style="
                  padding:14px 16px;
                  border-bottom:1px solid #e2e8f0;
                  cursor:pointer;
                  ${
                    item.is_read !== true
                      ? "background:#eff6ff;"
                      : ""
                  }
                ">

                <strong>
                  ${escapeAdminNotice(
                    item.title ||
                    "Admin Notification"
                  )}
                </strong>

                <p style="
                  margin:6px 0;
                  line-height:1.45;
                ">
                  ${escapeAdminNotice(
                    item.message || ""
                  )}
                </p>

                <small style="color:#64748b;">
                  ${
                    item.created_at
                      ? new Date(
                          item.created_at
                        ).toLocaleString(
                          "en-IN"
                        )
                      : ""
                  }
                </small>

              </div>
            `).join("")
            : `
              <div style="padding:20px;">
                No notifications.
              </div>
            `
        }
      `;

      const markAll =
        panel.querySelector(
          "#dsFinalMarkAllRead"
        );

      if (markAll) {
        markAll.onclick =
          async function (e) {
            e.preventDefault();
            e.stopPropagation();

            const { error } =
              await client
                .from("admin_notifications")
                .update({
                  is_read: true
                })
                .eq(
                  "is_read",
                  false
                );

            if (error) {
              console.error(
                "Admin mark all read:",
                error.message
              );
              return;
            }

            await loadFinalAdminNotifications();
          };
      }

      panel
        .querySelectorAll(
          "[data-ds-admin-notification]"
        )
        .forEach(function (item) {

          item.onclick =
            async function (e) {

              e.stopPropagation();

              const id =
                item.getAttribute(
                  "data-ds-admin-notification"
                );

              const { error } =
                await client
                  .from("admin_notifications")
                  .update({
                    is_read: true
                  })
                  .eq("id", id);

              if (!error) {
                await loadFinalAdminNotifications();
              }
            };
        });

    } catch (error) {

      if (count) {
        count.textContent = "0";
      }

      panel.innerHTML = `
        <div style="padding:18px;color:#b91c1c;">
          ${escapeAdminNotice(error.message)}
        </div>
      `;

      console.error(
        "Final Admin Notifications:",
        error
      );
    }
  }

  // -----------------------------------------------
  // SINGLE CAPTURE HANDLER
  // Old conflicting handlers ko block karega
  // -----------------------------------------------
  document.addEventListener(
    "click",
    async function (event) {

      const darkButton =
        event.target.closest(
          "#adminDarkModeToggle"
        );

      if (darkButton) {

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        document.body.classList.toggle(
          "admin-dark-mode"
        );

        const enabled =
          document.body.classList.contains(
            "admin-dark-mode"
          );

        localStorage.setItem(
          "divyangsathi-admin-theme",
          enabled ? "dark" : "light"
        );

        localStorage.setItem(
          "adminTheme",
          enabled ? "dark" : "light"
        );

        updateDarkButton();

        return;
      }

      const bell =
        event.target.closest(
          "#adminNotificationBtn"
        );

      if (bell) {

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const panel =
          getAdminNotificationPanel();

        const opening =
          panel.style.display !== "block";

        panel.style.display =
          opening ? "block" : "none";

        if (opening) {
          await loadFinalAdminNotifications();
        }

        return;
      }

      const panel =
        document.getElementById(
          "dsFinalAdminNotificationPanel"
        );

      if (
        panel &&
        panel.style.display === "block" &&
        !panel.contains(event.target)
      ) {
        panel.style.display = "none";
      }
    },
    true
  );

  // Header layout.js se baad me aata hai
  function start() {
    restoreAdminDarkMode();

    setTimeout(
      restoreAdminDarkMode,
      300
    );
  }

  document.addEventListener(
    "DOMContentLoaded",
    start
  );

  document.addEventListener(
    "divyangsathi:layout-ready",
    start
  );

  if (document.readyState !== "loading") {
    start();
  }

})();

// ==========================================================
// DIVYANGSATHI FINAL PDF OVERRIDE
// USER + ADMIN FULL PROFILE PDF
// DIRECT jsPDF - NO HTML CAPTURE - NO WHITE PDF
// PASTE AT VERY END OF app.js
// ==========================================================

(function () {
  "use strict";

  // --------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------

  function dsPdfSafe(value) {
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    ) {
      return "-";
    }

    return String(value).trim();
  }

  function dsPdfNiceStatus(value) {
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    ) {
      return "-";
    }

    const s = String(value)
      .replace(/_/g, " ")
      .trim();

    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function dsPdfFileName(value) {
    return String(value || "Profile")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 70);
  }

  function dsGetJsPdf() {
    if (
      window.jspdf &&
      window.jspdf.jsPDF
    ) {
      return window.jspdf.jsPDF;
    }

    if (window.jsPDF) {
      return window.jsPDF;
    }

    return null;
  }

  async function dsImageToDataUrl(url) {
    if (!url) return null;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();

      return await new Promise(function (resolve) {
        const reader = new FileReader();

        reader.onload = function () {
          resolve(reader.result);
        };

        reader.onerror = function () {
          resolve(null);
        };

        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn(
        "PDF profile photo load skipped:",
        error
      );

      return null;
    }
  }

  // --------------------------------------------------------
  // LOAD PROFILE DIRECTLY FROM SUPABASE
  // --------------------------------------------------------

  async function dsLoadPdfProfile(profileId) {
    if (!profileId) {
      throw new Error(
        "Profile ID nahi mili."
      );
    }

    const {
      data,
      error
    } = await client
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error(
        "Profile record nahi mila."
      );
    }

    return data;
  }

  // --------------------------------------------------------
  // FINAL PDF GENERATOR
  // --------------------------------------------------------

  async function dsGenerateFullProfilePdf(
    profile,
    mode
  ) {
    const JsPDF = dsGetJsPdf();

    if (!JsPDF) {
      alert(
        "PDF library load nahi hui. Page refresh karke dobara try kare."
      );
      return;
    }

    const doc = new JsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = 210;
    const pageHeight = 297;

    const marginLeft = 15;
    const marginRight = 15;

    const usableWidth =
      pageWidth -
      marginLeft -
      marginRight;

    let y = 18;

    // ------------------------------------------------------
    // PAGE CHECK
    // ------------------------------------------------------

    function ensureSpace(height) {
      if (y + height > 278) {
        doc.addPage();
        y = 18;
      }
    }

    // ------------------------------------------------------
    // SECTION
    // ------------------------------------------------------

    function section(title) {
      ensureSpace(18);

      doc.setFillColor(
        239,
        246,
        255
      );

      doc.roundedRect(
        marginLeft,
        y - 5,
        usableWidth,
        10,
        2,
        2,
        "F"
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(12);

      doc.setTextColor(
        29,
        78,
        216
      );

      doc.text(
        title,
        marginLeft + 3,
        y + 1
      );

      y += 12;
    }

    // ------------------------------------------------------
    // ROW
    // ------------------------------------------------------

    function row(label, value) {
      const finalValue =
        dsPdfSafe(value);

      doc.setFontSize(9.5);

      const wrapped =
        doc.splitTextToSize(
          finalValue,
          108
        );

      const lineCount =
        Math.max(
          1,
          wrapped.length
        );

      const rowHeight =
        Math.max(
          8,
          lineCount * 4.5 + 4
        );

      ensureSpace(rowHeight);

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setTextColor(
        55,
        65,
        81
      );

      doc.text(
        label + ":",
        marginLeft + 2,
        y
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setTextColor(
        17,
        24,
        39
      );

      doc.text(
        wrapped,
        marginLeft + 58,
        y
      );

      y += rowHeight;

      doc.setDrawColor(
        226,
        232,
        240
      );

      doc.line(
        marginLeft,
        y - 3,
        pageWidth - marginRight,
        y - 3
      );
    }

    // ------------------------------------------------------
    // LONG TEXT
    // ------------------------------------------------------

    function paragraph(
      title,
      value
    ) {
      section(title);

      const text =
        dsPdfSafe(value);

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(10);

      doc.setTextColor(
        17,
        24,
        39
      );

      const lines =
        doc.splitTextToSize(
          text,
          usableWidth - 8
        );

      let start = 0;

      while (start < lines.length) {
        ensureSpace(15);

        const availableLines =
          Math.max(
            1,
            Math.floor(
              (278 - y) / 5
            )
          );

        const part =
          lines.slice(
            start,
            start + availableLines
          );

        doc.text(
          part,
          marginLeft + 4,
          y
        );

        y +=
          part.length * 5 + 5;

        start += part.length;

        if (start < lines.length) {
          doc.addPage();
          y = 18;
        }
      }
    }

    // ------------------------------------------------------
    // HEADER
    // ------------------------------------------------------

    doc.setFillColor(
      37,
      99,
      235
    );

    doc.rect(
      0,
      0,
      pageWidth,
      34,
      "F"
    );

    doc.setTextColor(
      255,
      255,
      255
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(22);

    doc.text(
      "DivyangSathi",
      marginLeft,
      13
    );

    doc.setFontSize(10);

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.text(
      mode === "admin"
        ? "Admin Generated Matrimony Profile"
        : "Matrimony Profile",
      marginLeft,
      21
    );

    doc.text(
      "Profile ID: " +
        dsPdfSafe(profile.id),
      marginLeft,
      27
    );

    y = 44;

    // ------------------------------------------------------
    // PROFILE PHOTO
    // ------------------------------------------------------

    let photoAdded = false;

    if (profile.profile_photo) {
      const photo =
        await dsImageToDataUrl(
          profile.profile_photo
        );

      if (photo) {
        try {
          const imageType =
            String(photo)
              .toLowerCase()
              .includes(
                "image/png"
              )
              ? "PNG"
              : "JPEG";

          doc.addImage(
            photo,
            imageType,
            marginLeft,
            y,
            34,
            34,
            undefined,
            "FAST"
          );

          photoAdded = true;
        } catch (error) {
          console.warn(
            "PDF photo add skipped:",
            error
          );
        }
      }
    }

    // ------------------------------------------------------
    // PROFILE SUMMARY
    // ------------------------------------------------------

    const summaryX =
      photoAdded
        ? marginLeft + 42
        : marginLeft;

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(17);

    doc.setTextColor(
      15,
      23,
      42
    );

    const name =
      dsPdfSafe(
        profile.full_name ||
          "DivyangSathi Member"
      );

    doc.text(
      doc.splitTextToSize(
        name,
        photoAdded
          ? 132
          : usableWidth
      ),
      summaryX,
      y + 5
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(10);

    doc.setTextColor(
      71,
      85,
      105
    );

    doc.text(
      "Gender: " +
        dsPdfSafe(profile.gender),
      summaryX,
      y + 14
    );

    doc.text(
      "Age: " +
        dsPdfSafe(profile.age),
      summaryX,
      y + 20
    );

    doc.text(
      "Membership: " +
        dsPdfSafe(
          profile.membership_plan ||
            "Free"
        ),
      summaryX,
      y + 26
    );

    doc.text(
      "Verification: " +
        (
          profile.verified === true
            ? "Verified"
            : "Pending"
        ),
      summaryX,
      y + 32
    );

    y += 43;

    // ------------------------------------------------------
    // BASIC DETAILS
    // ------------------------------------------------------

    section(
      "Personal Information"
    );

    row(
      "Full Name",
      profile.full_name
    );

    row(
      "Gender",
      profile.gender
    );

    row(
      "Age",
      profile.age
    );

    row(
      "Date of Birth",
      profile.date_of_birth ||
        profile.dob
    );

    row(
      "Marital Status",
      profile.marital_status
    );

    row(
      "Religion",
      profile.religion
    );

    row(
      "Caste",
      profile.caste
    );

    row(
      "Height",
      profile.height
    );

    row(
      "Weight",
      profile.weight
    );

    // ------------------------------------------------------
    // CONTACT DETAILS
    // ------------------------------------------------------

    section(
      "Contact Information"
    );

    row(
      "Mobile Number",
      profile.mobile
    );

    row(
      "Email Address",
      profile.email
    );

    // ------------------------------------------------------
    // LOCATION
    // ------------------------------------------------------

    section("Location");

    row(
      "State",
      profile.state
    );

    row(
      "District",
      profile.district
    );

    row(
      "City",
      profile.city
    );

    row(
      "Address",
      profile.address
    );

    // ------------------------------------------------------
    // DISABILITY
    // ------------------------------------------------------

    section(
      "Disability Information"
    );

    row(
      "Disability Type",
      profile.disability_type
    );

    row(
      "Disability Percentage",
      profile.disability_percentage
    );

    row(
      "Disability Details",
      profile.disability_details
    );

    // ------------------------------------------------------
    // EDUCATION / WORK
    // ------------------------------------------------------

    section(
      "Education & Career"
    );

    row(
      "Education",
      profile.education
    );

    row(
      "Occupation",
      profile.occupation
    );

    row(
      "Annual Income",
      profile.income
    );

    row(
      "Company / Organization",
      profile.company ||
        profile.organization
    );

    // ------------------------------------------------------
    // ABOUT
    // ------------------------------------------------------

    paragraph(
      "About Me",
      profile.about_me ||
        profile.about
    );

    paragraph(
      "Partner Preference",
      profile.partner_preference
    );

    // ------------------------------------------------------
    // PROFILE / VERIFICATION STATUS
    // ------------------------------------------------------

    section(
      "Profile Verification"
    );

    row(
      "Profile Verified",
      profile.verified === true
        ? "Verified"
        : "Pending"
    );

    row(
      "Aadhaar Verification",
      dsPdfNiceStatus(
        profile.aadhaar_status
      )
    );

    row(
      "Face Verification",
      dsPdfNiceStatus(
        profile.face_verification_status
      )
    );

    row(
      "Voice Intro",
      dsPdfNiceStatus(
        profile.voice_intro_status
      )
    );

    row(
      "Profile Active",
      profile.active === false
        ? "No"
        : "Yes"
    );

    row(
      "Blocked",
      profile.blocked === true
        ? "Yes"
        : "No"
    );

    // ------------------------------------------------------
    // MEMBERSHIP
    // ------------------------------------------------------

    section(
      "Membership Information"
    );

    row(
      "Membership Plan",
      profile.membership_plan ||
        "Free"
    );

    row(
      "Premium Member",
      profile.premium === true
        ? "Yes"
        : "No"
    );

    row(
      "Membership Expiry",
      profile.membership_expiry
    );

    row(
      "Remaining Profile Views",
      profile.remaining_profile_views
    );

    // ------------------------------------------------------
    // MEDIA
    // ------------------------------------------------------

    section(
      "Profile Media"
    );

    row(
      "Profile Photo",
      profile.profile_photo
        ? "Uploaded"
        : "Not Uploaded"
    );

    row(
      "Intro Video",
      profile.intro_video_url ||
      profile.video_url
        ? "Uploaded"
        : "Not Uploaded"
    );

    row(
      "Voice Intro",
      profile.voice_intro_url
        ? "Uploaded"
        : "Not Uploaded"
    );

    row(
      "Aadhaar Front",
      profile.aadhaar_front_url
        ? "Uploaded"
        : "Not Uploaded"
    );

    row(
      "Aadhaar Back",
      profile.aadhaar_back_url
        ? "Uploaded"
        : "Not Uploaded"
    );

    row(
      "Face Verification Photo",
      profile.face_photo_url
        ? "Uploaded"
        : "Not Uploaded"
    );

    // ------------------------------------------------------
    // SYSTEM DETAILS - ADMIN ONLY
    // ------------------------------------------------------

    if (mode === "admin") {
      section(
        "Admin / System Information"
      );

      row(
        "User ID",
        profile.id
      );

      row(
        "Created At",
        profile.created_at
      );

      row(
        "Updated At",
        profile.updated_at
      );

      row(
        "Profile Views",
        profile.profile_views
      );

      row(
        "Last Seen",
        profile.last_seen
      );
    }

    // ------------------------------------------------------
    // PAGE FOOTERS
    // ------------------------------------------------------

    const totalPages =
      doc.internal
        .getNumberOfPages();

    for (
      let pageNo = 1;
      pageNo <= totalPages;
      pageNo++
    ) {
      doc.setPage(pageNo);

      doc.setDrawColor(
        226,
        232,
        240
      );

      doc.line(
        marginLeft,
        286,
        pageWidth - marginRight,
        286
      );

      doc.setTextColor(
        100,
        116,
        139
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(8);

      doc.text(
        "DivyangSathi Matrimony",
        marginLeft,
        292
      );

      doc.text(
        "Page " +
          pageNo +
          " of " +
          totalPages,
        pageWidth -
          marginRight,
        292,
        {
          align: "right"
        }
      );
    }

    // ------------------------------------------------------
    // SAVE
    // ------------------------------------------------------

    const prefix =
      mode === "admin"
        ? "DivyangSathi_ADMIN_"
        : "DivyangSathi_";

    doc.save(
      prefix +
        dsPdfFileName(
          profile.full_name
        ) +
        "_Full_Profile.pdf"
    );
  }

  // ========================================================
  // USER PDF
  // IMPORTANT:
  // Capture phase stops OLD blank html2pdf click listener.
  // ========================================================

  document.addEventListener(
    "click",
    async function (event) {
      const button =
        event.target.closest(
          "#downloadProfilePdfBtn"
        );

      if (!button) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      try {
        button.disabled = true;

        const oldText =
          button.textContent;

        button.textContent =
          "⏳ Preparing PDF...";

        const params =
          new URLSearchParams(
            window.location.search
          );

        let profileId =
          params.get("id");

        // If button is ever used on own profile page
        if (!profileId) {
          const {
            data: {
              user
            }
          } =
            await client.auth.getUser();

          profileId =
            user?.id || null;
        }

        if (!profileId) {
          alert(
            "Profile ID nahi mili."
          );

          button.disabled =
            false;

          button.textContent =
            oldText;

          return;
        }

        const profile =
          await dsLoadPdfProfile(
            profileId
          );

        await dsGenerateFullProfilePdf(
          profile,
          "user"
        );

        button.disabled = false;

        button.textContent =
          oldText;

      } catch (error) {
        console.error(
          "USER FULL PDF ERROR:",
          error
        );

        alert(
          "Profile PDF download nahi hua: " +
            (
              error?.message ||
              error
            )
        );

        button.disabled =
          false;

        button.textContent =
          "📄 Download Profile PDF";
      }
    },
    true
  );

  // ========================================================
  // ADMIN PDF
  // Overrides OLD downloadAdminProfilePdf()
  // ========================================================

  window.downloadAdminProfilePdf =
    async function (profileId) {
      try {
        if (!profileId) {
          alert(
            "Profile ID nahi mili."
          );
          return;
        }

        const profile =
          await dsLoadPdfProfile(
            profileId
          );

        await dsGenerateFullProfilePdf(
          profile,
          "admin"
        );

      } catch (error) {
        console.error(
          "ADMIN FULL PDF ERROR:",
          error
        );

        alert(
          "Admin Profile PDF download nahi hua: " +
            (
              error?.message ||
              error
            )
        );
      }
    };

  console.log(
    "✅ DivyangSathi User + Admin Full PDF Override Loaded"
  );

})();