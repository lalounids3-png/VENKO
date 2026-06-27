let carrito = [];
let productos = [];

function abrirModal(texto){
    document.querySelector('#m h5').innerHTML = texto;
    new bootstrap.Modal(document.getElementById('m')).show();
}

function agregarCarrito(pos){
    let p = productos[pos];
    let existe = carrito.find(x => x.id == p.id_producto);

    if(existe){
        existe.cantidad++;
    }else{
        carrito.push({
            id: p.id_producto,
            nombre: p.nombre_producto,
            precio: p.precio,
            imagen: p.imagen,
            cantidad: 1
        });
    }

    alert('Agregado al carrito');
}

function quitarCarrito(pos){
    carrito.splice(pos, 1);
    verCarrito();
}

function verCarrito(){
    let lista = document.getElementById('lista');
    lista.innerHTML = '';

    if(carrito.length == 0){
        lista.innerHTML = '<p>No hay productos en el carrito</p>';
        abrirModal('Carrito');
        return;
    }

    let total = 0;

    carrito.forEach((p, i) => {
        total += p.precio * p.cantidad;

        lista.innerHTML += `
        <div style="display:flex;gap:15px;margin:10px">
            <img src="${p.imagen}" style="width:90px;height:90px;object-fit:cover">
            <div>
                <b>${p.nombre}</b><br>
                Precio: $${p.precio}<br>
                Cantidad: ${p.cantidad}<br>
                <button onclick="quitarCarrito(${i})">Quitar</button>
            </div>
        </div>`;
    });

    lista.innerHTML += `
    <hr>
    <h5>Total: $${total}</h5>
    <button onclick="comprar()">Comprar</button>`;

    abrirModal('Carrito');
}

function comprar(){
    fetch('/comprar', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({carrito:carrito})
    })
    .then(r => r.json())
    .then(datos => {
        alert(datos.mensaje);

        if(datos.ok){
            carrito = [];
            verCarrito();
        }
    });
}

function cargarProductos(boton){
    let seccion = boton.dataset.sec;

    fetch('/productos/' + encodeURIComponent(seccion))
    .then(r => r.json())
    .then(datos => {
        productos = datos;

        let lista = document.getElementById('lista');
        lista.innerHTML = '';
        datos.forEach((p, i) => {
            lista.style.background = "#91c1f8c5";
            lista.innerHTML += `
            <div style="display:flex;gap:15px;margin:10px";>
                <img src="${p.imagen}" style="width:120px;height:120px;object-fit:cover">
                <div>
                    <b>${p.nombre_producto}</b><br>
                    Precio: $${p.precio}<br>
                    Disponibles: ${p.cantidad}<br>
                    <div class="button_carrito">
                    <button onclick="agregarCarrito(${i})" >Agregar</button>
                    </div>
                </div>
            </div>`;
        });

        abrirModal('Productos');
    });
}

document.querySelectorAll('.ver').forEach(boton => {
    boton.onclick = function(){
        cargarProductos(boton);
    };
});

document.getElementById('liveAlertBtn').onclick = verCarrito;