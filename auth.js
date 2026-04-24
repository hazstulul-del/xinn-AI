// LOGIN GOOGLE
function loginGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();

  auth.signInWithPopup(provider)
    .then((result) => {
      const user = result.user;

      // simpan user
      localStorage.setItem("user", JSON.stringify({
        name: user.displayName,
        email: user.email,
        photo: user.photoURL
      }));

      // redirect ke chat
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert("Login gagal: " + error.message);
    });
}


// CEK LOGIN (dipakai di index.html)
function checkLogin() {
  const user = localStorage.getItem("user");

  if (!user) {
    window.location.href = "login.html";
  }
}


// LOGOUT
function logout() {
  auth.signOut().then(() => {
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });
        }
