// 2. Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDTn8P-f2Guwg7w4vhIyhBiBSXAOViSzsI",
  authDomain: "proyecto-13042.firebaseapp.com",
  projectId: "proyecto-13042",
  storageBucket: "proyecto-13042.firebasestorage.app",
  messagingSenderId: "845322239757",
  appId: "1:845322239757:web:c40af7f6e93234777ffa44",
  measurementId: "G-YNSPHD52N8"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- ELEMENTOS DE LA UI ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubmit = document.getElementById('auth-submit');
const authToggle = document.getElementById('auth-toggle');
const form = document.getElementById('todo-form');
const taskList = document.getElementById('task-list');

let isLogin = true;

// --- LÓGICA DE AUTENTICACIÓN ---

// Detectar si el usuario ya está logueado
auth.onAuthStateChanged((user) => {
    if (user) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        appContainer.classList.remove('app-enter');
        void appContainer.offsetWidth;
        appContainer.classList.add('app-enter');
        renderTasks();
    } else {
        authContainer.style.display = 'block';
        authContainer.classList.remove('flip-animate');
        void authContainer.offsetWidth;
        authContainer.classList.add('flip-animate');
        appContainer.style.display = 'none';
    }
});

// Función para cambiar entre Login y Registro
window.toggleAuth = () => {
    isLogin = !isLogin;
    authTitle.innerText = isLogin ? "Iniciar Sesión" : "Registrarse";
    authSubmit.innerText = isLogin ? "Entrar" : "Crear Cuenta";
    authToggle.innerHTML = isLogin
        ? '¿No tienes cuenta? <span onclick="toggleAuth()">Regístrate aquí</span>'
        : '¿Ya tienes cuenta? <span onclick="toggleAuth()">Inicia sesión</span>';

    // Efecto flip al cambiar
    const form = document.getElementById('auth-form');
    form.classList.remove('flip-animate');
    void form.offsetWidth;
    form.classList.add('flip-animate');
};

// Manejar el envío del formulario de Login/Registro
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;

    try {
        if (isLogin) {
            await auth.signInWithEmailAndPassword(email, pass);
        } else {
            await auth.createUserWithEmailAndPassword(email, pass);
            alert("¡Cuenta creada! Iniciando sesión...");
        }
    } catch (error) {
        alert("Error: " + error.message);
    }
});

window.logout = () => auth.signOut();

// --- LÓGICA DE TAREAS CON FIRESTORE ---

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const submitBtn = document.getElementById('submit-btn');
    const editId = submitBtn.dataset.editId;

    if (editId) {
        await db.collection("tasks").doc(editId).update({
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
        });
        delete submitBtn.dataset.editId;
        submitBtn.textContent = 'Agregar Tarea';
        submitBtn.classList.remove('edit-mode');
    } else {
        await db.collection("tasks").add({
            userId: user.uid,
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            timestamp: Date.now()
        });
    }
    form.reset();
    renderTasks();
});

async function renderTasks() {
    const user = auth.currentUser;
    if (!user) return;

    const snapshot = await db.collection("tasks").where("userId", "==", user.uid).get();

    taskList.innerHTML = '';
    snapshot.forEach((docSnap) => {
        const task = docSnap.data();
        const id = docSnap.id;

        const div = document.createElement('div');
        div.className = 'task-card';
        div.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description}</p>
            <div class="meta">${task.date} | ${task.time}</div>
            <div class="actions">
                <button class="delete-btn" onclick="deleteTask('${id}')">Borrar</button>
                <button class="edit-btn">Editar</button>
            </div>
        `;
        div.querySelector('.edit-btn').addEventListener('click', () => {
            editTask(id, task.title, task.description, task.date, task.time);
        });
        taskList.appendChild(div);
    });
}

// Función global para borrar
window.deleteTask = async (id) => {
    if(confirm("¿Seguro que quieres borrar esta tarea?")) {
        await db.collection("tasks").doc(id).delete();
        renderTasks();
    }
};

window.editTask = async (id, title, description, date, time) => {
    document.getElementById('title').value = title;
    document.getElementById('description').value = description;
    document.getElementById('date').value = date;
    document.getElementById('time').value = time;

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.textContent = 'Guardar Cambios';
    submitBtn.dataset.editId = id;
    submitBtn.classList.add('edit-mode');
    document.getElementById('title').focus();
};
