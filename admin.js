
// 🔥 FIREBASE IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot, 
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc   // ✅ add here
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";





// 🔑 FIREBASE CONFIG (REPLACE WITH YOURS)
const firebaseConfig = {
  apiKey: "AIzaSyBBD_MiOr1WxnwtknFtFWkrXIHEeDeVWmU",
  authDomain: "choudharyicecream.firebaseapp.com",
  projectId: "choudharyicecream",
  storageBucket: "choudharyicecream.firebasestorage.app",
  messagingSenderId: "534606829278",
  appId: "1:534606829278:web:b10c63f8340c158df0d44f",
  measurementId: "G-T1EJ28G8TF"
};

// 🚀 INIT FIREBASE
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// 🔑 IMGBB API KEY
const API_KEY = "9d945200026298fb65615ef2197c9c81";


import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const auth = getAuth();



onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const adminRef = doc(db, "admins", user.uid);
  const adminSnap = await getDoc(adminRef);

  if (!adminSnap.exists()) {
    window.location.href = "login.html";
  }
});


import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.querySelector(".logout-btn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});


// 📤 UPLOAD IMAGE WITH PROGRESS
document.getElementById("imageFile").addEventListener("change", async function () {
  const file = this.files[0];
  if (!file) return;

  // 🔥 COMPRESS
  const compressedFile = await compressImage(file);

  // 🖼 PREVIEW
  const preview = document.getElementById("previewImg");
  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";

  const formData = new FormData();
  formData.append("image", compressedFile);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", `https://api.imgbb.com/1/upload?key=${API_KEY}`);

  xhr.upload.onprogress = function (e) {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      document.getElementById("progressBar").style.width = percent + "%";
      document.getElementById("progressText").innerText = percent + "% uploading...";
    }
  };

  xhr.onload = function () {
    const res = JSON.parse(xhr.responseText);

    if (res.success) {
      document.getElementById("image").value = res.data.url;
      document.getElementById("progressText").innerText = "✅ Upload Complete";
    } else {
     showToast("Upload failed", "error");
    }
  };

  xhr.onerror = function () {
    showToast("Error occure", "error");
  };

  xhr.send(formData);




  function resetImageUpload() {
  // 🖼 Hide preview
  const preview = document.getElementById("previewImg");
  preview.src = "";
  preview.style.display = "none";

  // 📁 Clear file input
  document.getElementById("imageFile").value = "";

  // 📊 Reset progress bar
  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("progressText").innerText = "";

  // 🔗 Clear image URL field
  document.getElementById("image").value = "";
}





  
});


// ➕ ADD PRODUCT
window.addProduct = async function () {

  const name = document.getElementById("name").value.trim();
  const priceLimited = document.getElementById("priceLimited").value.trim();
  const priceUnlimited = document.getElementById("priceUnlimited").value.trim();
  const image = document.getElementById("image").value.trim();
  const category = document.getElementById("category").value;

  // ❌ VALIDATION
  if (!name || !priceLimited || !priceUnlimited || !image || !category){
   showToast("Please fill all fields", "warning");
    return;
  }

  // ✅ ADD TO FIREBASE
  await addDoc(collection(db, "products"), {
  name,
  priceLimited,
  priceUnlimited,
  image,
  category
});

 showToast("Product added successfully!", "success");

  clearForm();
  resetImageUpload(); // important
  
};


function highlightError(inputId) {
  const field = document.getElementById(inputId);
  field.style.border = "2px solid red";

  setTimeout(() => {
    field.style.border = "none";
  }, 2000);
}



// 🔄 LOAD PRODUCTS
let unsubscribeProducts = null;

function loadProducts(searchTerm = "") {
  const container = document.getElementById("productList");

  if (unsubscribeProducts) unsubscribeProducts(); // stop old listener

  unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
    container.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const p = docSnap.data();

      // 🔍 FILTER
      if (
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        const div = document.createElement("div");
        div.className = "product-item";

        div.innerHTML = `
          <img src="${p.image}" class="admin-img">

          <div class="product-info">
            <b>${p.name}</b>
            <p>
  ₹${p.priceLimited || 0} (Litre)<br>
  ₹${p.priceUnlimited || 0} (Person)
</p>
            <small>${p.category}</small>
          </div>

          <div class="actions">
            <button onclick="editProduct('${docSnap.id}', '${p.name}', '${p.price}', '${p.image}', '${p.category}')">
              ✏️ Edit
            </button>
            <button onclick="deleteProduct('${docSnap.id}')">
              ❌ Delete
            </button>
          </div>
        `;

        container.appendChild(div);
      }
    });
  });
}

// ❌ DELETE PRODUCT (WITH CONFIRM)
window.deleteProduct = async function (id) {
  const confirmDelete = confirm("Are you sure you want to delete this product?");
  if (!confirmDelete) return;

  await deleteDoc(doc(db, "products", id));
  loadProducts();
};


// ✏️ OPEN EDIT POPUP
window.editProduct = function (id, name, price, image, category) {


  loadCategories();
  
  document.getElementById("editName").value = name;
  document.getElementById("editPrice").value = price;
  document.getElementById("editImage").value = image;

  // 🖼 Show preview
  const preview = document.getElementById("editPreviewImg");
  preview.src = image;
  preview.style.display = "block";

  // 📂 Select category
  document.getElementById("editCategory").value = category;

  window.editId = id;

  document.getElementById("editPopup").style.display = "flex";
};



document.getElementById("editImageFile").addEventListener("change", async function () {
  const file = this.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  if (data.success) {
    document.getElementById("editImage").value = data.data.url;

    const preview = document.getElementById("editPreviewImg");
    preview.src = data.data.url;
    preview.style.display = "block";

    showToast("Image updated", "success");
  }
});


// 🔄 UPDATE PRODUCT (FIXED)
window.updateProduct = async function () {

  if (!window.editId) {
    alert("No product selected!");
    return;
  }

  const name = document.getElementById("editName").value;
  const price = document.getElementById("editPrice").value;
  const image = document.getElementById("editImage").value;
  const category = document.getElementById("editCategory").value;

  try {
    await updateDoc(doc(db, "products", window.editId), {
      name,
      price,
      image,
      category
    });

   showToast("Product Updated!", "success");

    closePopup();
    loadProducts();

  } catch (err) {
    console.error(err);
   showToast("Upload failed", "error");
  }
};


// ❌ CLOSE POPUP
window.closePopup = function () {
  document.getElementById("editPopup").style.display = "none";
};


// 🧹 CLEAR FORM
function clearForm() {
 document.getElementById("name").value = "";
  document.getElementById("priceLimited").value = "";
  document.getElementById("priceUnlimited").value = "";
  document.getElementById("image").value = "";
  document.getElementById("category").value = "";

  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("progressText").innerText = "";
}


// 🔄 INITIAL LOAD
loadProducts();


window.addCategory = async function () {
  const name = document.getElementById("categoryName").value;

  if (!name) {
    alert("Enter category name");
    return;
  }

  await addDoc(collection(db, "categories"), {
    name
  });

  document.getElementById("categoryName").value = "";

  loadCategories();
};


async function loadCategories() {
  const dropdown = document.getElementById("category");
  const list = document.getElementById("categoryList");

  const editDropdown = document.getElementById("editCategory");

  dropdown.innerHTML = "";
  list.innerHTML = "";

  // ✅ FIX: check if edit dropdown exists
  if (editDropdown) editDropdown.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "categories"));

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();

    // ADD PRODUCT DROPDOWN
    const option = document.createElement("option");
    option.value = data.name;
    option.textContent = data.name;
    dropdown.appendChild(option);

    // EDIT DROPDOWN (SAFE)
    if (editDropdown) {
      const option2 = document.createElement("option");
      option2.value = data.name;
      option2.textContent = data.name;
      editDropdown.appendChild(option2);
    }

    // CATEGORY LIST
    const div = document.createElement("div");
    div.innerHTML = `
      <div class="category-item-row">
        <span>${data.name}</span>
        <button onclick="deleteCategory('${docSnap.id}')">✖</button>
      </div>
    `;
    list.appendChild(div);
  });
}


window.deleteCategory = async function (id) {
  const confirmDelete = confirm("Delete this category?");
  if (!confirmDelete) return;

  await deleteDoc(doc(db, "categories", id));
  loadCategories();
};

loadCategories();







// 🔥 IMAGE COMPRESSION FUNCTION//
async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = (e) => img.src = e.target.result;

    img.onload = function () {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const MAX_WIDTH = 800;
      const scale = MAX_WIDTH / img.width;

      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(blob => resolve(blob), "image/jpeg", 0.7);
    };
  });
}



document.getElementById("searchInput").addEventListener("input", function () {
  const searchValue = this.value;
  loadProducts(searchValue);
});



function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.style.animation = "fadeOut 0.4s forwards";
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}



async function loadReviews() {
  const container = document.getElementById("reviewList");
  container.innerHTML = "";

  const snapshot = await getDocs(collection(db, "reviews"));

  snapshot.forEach((docSnap) => {
    const r = docSnap.data();

    const div = document.createElement("div");
    div.className = "review-item";

    div.innerHTML = `
      <div class="review-info">
        <h4>${r.name}</h4>
        <div class="stars">${"⭐".repeat(r.rating)}</div>
        <p>${r.message}</p>
      </div>

      <div class="review-actions">
        <button onclick="deleteReview('${docSnap.id}')">❌</button>
      </div>
    `;

    container.appendChild(div);
  });
}



window.deleteReview = async function (id) {
  const confirmDelete = confirm("Delete this review?");
  if (!confirmDelete) return;

  await deleteDoc(doc(db, "reviews", id));

  showToast("Review deleted", "success");
  loadReviews();
};


loadReviews();