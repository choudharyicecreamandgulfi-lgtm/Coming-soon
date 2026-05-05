// 🔥 FIREBASE IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  getDoc,
  query,
  orderBy,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// 🔑 CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBBD_MiOr1WxnwtknFtFWkrXIHEeDeVWmU",
  authDomain: "choudharyicecream.firebaseapp.com",
  projectId: "choudharyicecream",
  storageBucket: "choudharyicecream.firebasestorage.app",
  messagingSenderId: "534606829278",
  appId: "1:534606829278:web:b10c63f8340c158df0d44f"
};

// 🚀 INIT
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("✅ Real-time order.js loaded");

let unsubscribe = null;

// 🔐 ADMIN CHECK
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const adminRef = doc(db, "admins", user.uid);
  const adminSnap = await getDoc(adminRef);

  if (!adminSnap.exists()) {
    window.location.href = "login.html";
    return;
  }

  loadOrders();
});

// 🕒 TIME AGO
function timeAgo(dateValue) {
  if (!dateValue) return "Just now";

  let past = dateValue.seconds
    ? new Date(dateValue.seconds * 1000)
    : new Date(dateValue);

  const diff = Math.floor((new Date() - past) / 1000);

  if (isNaN(diff)) return "Just now";
  if (diff < 60) return "Just now";
  if (diff < 3600) return Math.floor(diff / 60) + " min ago";
  if (diff < 86400) return Math.floor(diff / 3600) + " hr ago";
  return Math.floor(diff / 86400) + " days ago";
}

// 📅 FORMAT DATE
function formatDate(dateValue) {
  if (!dateValue) return "-";

  const d = dateValue.seconds
    ? new Date(dateValue.seconds * 1000)
    : new Date(dateValue);

  return d.toLocaleString();
}

// 🔄 REAL-TIME ORDERS
function loadOrders(searchTerm = "") {
  const container = document.getElementById("orderList");
  if (!container) return;

  if (unsubscribe) unsubscribe(); // stop previous listener

  const q = query(
    collection(db, "orders"),
    orderBy("date", "desc")
  );

  unsubscribe = onSnapshot(q, (snapshot) => {
    container.innerHTML = "";

    let totalOrders = 0;
    let totalRevenue = 0;

    const search = searchTerm.toLowerCase();
    let index = 0;

    snapshot.forEach((docSnap) => {
      const o = docSnap.data();

      totalOrders++;
      totalRevenue += Number(o.total || 0);

      const order = { ...o, id: docSnap.id };

      // ✅ SHOW ALL IF NO SEARCH
      if (!searchTerm) {
        renderOrder(order, index);
        index++;
        return;
      }

      // 🔍 FILTER
      const match =
        (o.customerName || "").toLowerCase().includes(search) ||
        (o.email || "").toLowerCase().includes(search) ||
        (o.phone || "").toLowerCase().includes(search);

      if (match) {
        renderOrder(order, index);
        index++;
      }
    });

    // 📊 DASHBOARD UPDATE
    document.getElementById("totalOrders").innerText = totalOrders;
    document.getElementById("totalRevenue").innerText = "₹" + totalRevenue;

    if (!container.innerHTML.trim()) {
      container.innerHTML = "<p>No matching orders 🔍</p>";
    }
  });
}

// 🎯 RENDER ORDER CARD
function renderOrder(o, index) {
  const container = document.getElementById("orderList");

  let itemsHTML = "";
  if (o.items) {
    o.items.forEach(item => {
      itemsHTML += `<li>${item.name} (₹${item.price} × ${item.qty})</li>`;
    });
  }

  const latestBadge = index === 0
    ? `<span class="latest-badge">🔥 Latest</span>`
    : "";

  const statusClass = (o.status || "pending").toLowerCase();

  const toggleText = o.status === "Delivered"
    ? "↩️ Pending"
    : "✅ Delivered";

  const div = document.createElement("div");
  div.className = "order-card";

  div.innerHTML = `
    <h3>👤 ${o.customerName || "No Name"} ${latestBadge}</h3>

    <p>📧 ${o.email || "-"}</p>
    <p>📞 ${o.phone || "-"}</p>
    <p>📍 ${o.address || "-"}</p>

    <h4>🧾 Items:</h4>
    <ul>${itemsHTML}</ul>

    <p><b>💰 Total: ₹${o.total || 0}</b></p>

    <p>🕒 ${timeAgo(o.date)}</p>
    <p>📅 ${formatDate(o.date)}</p>

    <p>
      📦 Status:
      <span class="status ${statusClass}">
        ${o.status || "Pending"}
      </span>
    </p>

    <div style="margin-top:10px;">
      <button onclick="toggleStatus('${o.id}', '${o.status || "Pending"}')">
        ${toggleText}
      </button>

      <button onclick="deleteOrder('${o.id}')" style="background:red;color:white;">
        🗑️ Delete
      </button>
    </div>
  `;

  container.appendChild(div);
}

// 🔄 TOGGLE STATUS
window.toggleStatus = async function(id, currentStatus) {
  const newStatus = currentStatus === "Delivered"
    ? "Pending"
    : "Delivered";

  await updateDoc(doc(db, "orders", id), {
    status: newStatus
  });
};

// 🗑️ DELETE ORDER
window.deleteOrder = async function(id) {
  if (!confirm("Delete this order?")) return;

  await deleteDoc(doc(db, "orders", id));
};

// 🔍 SEARCH
document.getElementById("searchOrder").addEventListener("input", function () {
  loadOrders(this.value);
});

// 📦 SHOW ALL BUTTON
const btn = document.getElementById("showAllBtn");
if (btn) {
  btn.addEventListener("click", () => {
    document.getElementById("searchOrder").value = "";
    loadOrders();
  });
}





// disible right click and F12 to prevent dev tools access (not foolproof but a deterrent)//

document.addEventListener("contextmenu", e => e.preventDefault());

document.onkeydown = function(e) {
  if (e.keyCode == 123) {
    return false;
  }
};

setInterval(() => {
  if (window.outerWidth - window.innerWidth > 100) {
    alert("DevTools detected!");
  }
}, 1000);