alert("Bienvenido, accediste como Administrador :)");

function panel(contenido){
    document.getElementById('panelAdmin').innerHTML = contenido;
}

function titulo(texto){
    document.getElementById('tituloPanel').innerHTML = texto;
}

function mostrarUsuarios(){
    titulo('Usuarios');

    fetch('/usuarios')
    .then(r => r.json())
    .then(datos => {

        panel(`
        <input id="usuario" placeholder="Usuario" class="form-control mb-2">
        <input id="correo" placeholder="Correo" class="form-control mb-2">
        <input id="password" placeholder="Contraseña" class="form-control mb-2">

        <select id="rol" class="form-control mb-2">
            <option>Cliente</option>
            <option>Administrador</option>
        </select>

        <button class="btn btn-success mb-3" onclick="agregarUsuario()">Agregar usuario</button>

        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>ID</th><th>Usuario</th><th>Correo</th><th>Rol</th><th>Acción</th>
                </tr>
            </thead>
            <tbody id="tablaUsuarios"></tbody>
        </table>
        `);

        let tabla = document.getElementById('tablaUsuarios');

        datos.forEach(u => {
            tabla.innerHTML += `
            <tr>
                <td>${u.id_usuario}</td>
                <td>${u.nombre_usuario}</td>
                <td>${u.correo}</td>
                <td>${u.rol}</td>
                <td><button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${u.id_usuario})">Eliminar</button></td>
            </tr>`;
        });
    });
}

function agregarUsuario(){
    let datos = {
        usuario: document.getElementById('usuario').value,
        correo: document.getElementById('correo').value,
        password: document.getElementById('password').value,
        rol: document.getElementById('rol').value
    };

    fetch('/agregar_usuario', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(datos)
    })
    .then(r => r.json())
    .then(() => {
        alert('Usuario agregado');
        mostrarUsuarios();
    });
}

function eliminarUsuario(id){
    if(confirm('¿Eliminar usuario?')){
        fetch('/eliminar_usuario/' + id, {method:'POST'})
        .then(r => r.json())
        .then(() => mostrarUsuarios());
    }
}

function mostrarProductos(){
    titulo('Productos');

    let buscar = document.getElementById('buscarProducto').value;

    fetch('/productos_admin?buscar=' + encodeURIComponent(buscar))
    .then(r => r.json())
    .then(datos => {

        panel(`
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>ID</th><th>Producto</th><th>Sección</th><th>Precio</th><th>Cantidad</th><th>Modificar</th>
                </tr>
            </thead>
            <tbody id="tablaProductos"></tbody>
        </table>
        `);

        let tabla = document.getElementById('tablaProductos');

        datos.forEach(p => {
            tabla.innerHTML += `
            <tr>
                <td>${p.id_producto}</td>
                <td>${p.nombre_producto}</td>
                <td>${p.seccion}</td>
                <td>$${p.precio}</td>
                <td>${p.cantidad}</td>
                <td>
                    <input type="number" id="cant${p.id_producto}" value="1" min="1" style="width:70px">
                    <button class="btn btn-success btn-sm" onclick="cambiarCantidad(${p.id_producto}, 'sumar')">+</button>
                    <button class="btn btn-warning btn-sm" onclick="cambiarCantidad(${p.id_producto}, 'restar')">-</button>
                </td>
            </tr>`;
        });
    });
}

function cambiarCantidad(id, accion){
    let cantidad = document.getElementById('cant' + id).value;

    fetch('/actualizar_cantidad', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id_producto:id, cantidad:cantidad, accion:accion})
    })
    .then(r => r.json())
    .then(() => mostrarProductos());
}

function verVentas(){
    titulo('Ventas');

    fetch('/ventas')
    .then(r => r.json())
    .then(datos => {

        panel(`
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>ID</th><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Total</th><th>Fecha</th>
                </tr>
            </thead>
            <tbody id="tablaVentas"></tbody>
        </table>
        `);

        let tabla = document.getElementById('tablaVentas');

        datos.forEach(v => {
            tabla.innerHTML += `
            <tr>
                <td>${v.id_venta}</td>
                <td>${v.producto}</td>
                <td>${v.cantidad}</td>
                <td>$${v.precio}</td>
                <td>$${v.total}</td>
                <td>${v.fecha}</td>
            </tr>`;
        });
    });
}

function buscarProducto(e){
    e.preventDefault();
    mostrarProductos();
}

document.getElementById('btnUsuarios').onclick = mostrarUsuarios;
document.getElementById('btnProductos').onclick = mostrarProductos;
document.getElementById('btnVentas').onclick = verVentas;
document.getElementById('formBuscar').onsubmit = buscarProducto;