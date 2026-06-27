from flask import Flask, render_template, request, jsonify
import mysql.connector
import os

app = Flask(__name__)

conexion = mysql.connector.connect(
    host=os.environ.get("DB_HOST"),
    user=os.environ.get("DB_USER"),
    password=os.environ.get("DB_PASSWORD"),
    database=os.environ.get("DB_NAME")
)

def crear_tabla_ventas():
    cursor = conexion.cursor()

    cursor.execute("""CREATE TABLE IF NOT EXISTS ventas(id_venta INT AUTO_INCREMENT PRIMARY KEY, 
                   producto VARCHAR(100),cantidad INT,precio DECIMAL(10,2), total DECIMAL(10,2), 
                   fecha DATETIME DEFAULT CURRENT_TIMESTAMP)""")

    conexion.commit()
    cursor.close()


def buscar_imagen(nombre_producto, seccion):

    if seccion == "Muñecas":
        carpeta = "barbies"
    elif seccion == "Carros":
        carpeta = "carros"
    elif seccion == "Balones":
        carpeta = "balones"
    elif seccion == "Juegos de Mesa":
        carpeta = "mesa"
    elif seccion == "Muñecos accion":
        carpeta = "munecos_accion"
    else:
        carpeta = ""

    ruta = os.path.join(app.root_path, "static", "imagenes_ puntod_venta", carpeta)

    if not os.path.exists(ruta):
        return "/static/logo.jpeg"

    nombre = nombre_producto.lower()

    for archivo in os.listdir(ruta):
        archivo_minuscula = archivo.lower()

        for palabra in nombre.split():
            if len(palabra) > 2 and palabra in archivo_minuscula:
                return "/static/imagenes_ puntod_venta/" + carpeta + "/" + archivo

    return "/static/logo.jpeg"


@app.route('/')
def inicio():
    crear_tabla_ventas()
    return render_template('login.html')


@app.route('/login', methods=['POST'])
def login():

    usuario = request.form['usuario']
    password = request.form['password']

    cursor = conexion.cursor(dictionary=True)

    consulta = """SELECT * FROM usuarios WHERE nombre_usuario = %s AND contrasena = %s"""

    cursor.execute(consulta, (usuario, password))
    resultado = cursor.fetchone()

    cursor.close()

    if resultado:
        if resultado['rol'] == "Administrador":
            return render_template('dashboard.html', nombre=resultado['nombre_usuario'], rol=resultado['rol'])
        elif resultado['rol'] == "Cliente":
            return render_template('dashboard_cliente.html', nombre=resultado['nombre_usuario'], rol=resultado['rol'])

    return render_template('login.html')


@app.route('/productos/<seccion>')
def productos(seccion):

    cursor = conexion.cursor(dictionary=True)

    consulta = """SELECT * FROM productos WHERE seccion = %s"""

    cursor.execute(consulta, (seccion,))
    productos = cursor.fetchall()

    cursor.close()

    for producto in productos:
        producto['imagen'] = buscar_imagen(producto['nombre_producto'], producto['seccion'])

    return jsonify(productos)


@app.route('/comprar', methods=['POST'])
def comprar():

    datos = request.get_json()
    carrito = datos['carrito']

    cursor = conexion.cursor(dictionary=True)

    for producto in carrito:
        id_producto = producto['id']
        cantidad = int(producto['cantidad'])

        cursor.execute("""SELECT * FROM productos WHERE id_producto = %s""", (id_producto,))
        encontrado = cursor.fetchone()

        if not encontrado:
            conexion.rollback()
            cursor.close()
            return jsonify({'ok': False, 'mensaje': 'Producto no encontrado'})

        if encontrado['cantidad'] < cantidad:
            conexion.rollback()
            cursor.close()
            return jsonify({'ok': False, 'mensaje': 'No hay suficiente cantidad de ' + encontrado['nombre_producto']})

        total = float(encontrado['precio']) * cantidad

        cursor.execute("""UPDATE productos SET cantidad = cantidad - %s WHERE id_producto = %s""",(cantidad, id_producto))

        cursor.execute("""INSERT INTO ventas (producto, cantidad, precio, total) VALUES (%s, %s, %s, %s)""",
            (encontrado['nombre_producto'], cantidad, encontrado['precio'], total))

    conexion.commit()
    cursor.close()

    return jsonify({'ok': True, 'mensaje': 'Compra realizada correctamente'})


@app.route('/usuarios')
def usuarios():

    cursor = conexion.cursor(dictionary=True)
    cursor.execute("""SELECT id_usuario, nombre_usuario, correo, rol FROM usuarios""")
    datos = cursor.fetchall()
    cursor.close()

    return jsonify(datos)


@app.route('/agregar_usuario', methods=['POST'])
def agregar_usuario():

    datos = request.get_json()
    cursor = conexion.cursor()

    consulta = """INSERT INTO usuarios (nombre_usuario, correo, contrasena, rol) VALUES (%s, %s, %s, %s)"""

    cursor.execute(consulta, (datos['usuario'], datos['correo'], datos['password'], datos['rol']))

    conexion.commit()
    cursor.close()

    return jsonify({'ok': True})


@app.route('/eliminar_usuario/<id_usuario>', methods=['POST'])
def eliminar_usuario(id_usuario):

    cursor = conexion.cursor()
    cursor.execute("""DELETE FROM usuarios WHERE id_usuario = %s""", (id_usuario,))
    conexion.commit()
    cursor.close()

    return jsonify({'ok': True})


@app.route('/productos_admin')
def productos_admin():

    buscar = request.args.get('buscar', '')

    cursor = conexion.cursor(dictionary=True)

    if buscar != '':
        consulta = """ SELECT * FROM productos WHERE id_producto = %s OR nombre_producto LIKE %s """
        cursor.execute(consulta, (buscar, '%' + buscar + '%'))
    else:
        cursor.execute("""SELECT * FROM productos""")

    datos = cursor.fetchall()
    cursor.close()

    return jsonify(datos)


@app.route('/actualizar_cantidad', methods=['POST'])
def actualizar_cantidad():

    datos = request.get_json()
    id_producto = datos['id_producto']
    cantidad = int(datos['cantidad'])
    accion = datos['accion']

    cursor = conexion.cursor()

    if accion == 'sumar':
        cursor.execute(
            """UPDATE productos SET cantidad = cantidad + %s WHERE id_producto = %s""", (cantidad, id_producto))
    else:
        cursor.execute("""UPDATE productos SET cantidad = cantidad - %s WHERE id_producto = %s AND cantidad >= %s""",
            (cantidad, id_producto, cantidad))

    conexion.commit()
    cursor.close()

    return jsonify({'ok': True})


@app.route('/ventas')
def ventas():

    crear_tabla_ventas()

    cursor = conexion.cursor(dictionary=True)
    cursor.execute("""SELECT * FROM ventas ORDER BY fecha DESC""")
    datos = cursor.fetchall()
    cursor.close()

    return jsonify(datos)


@app.route('/crear_cuenta')
def crear_cuenta():
    return render_template('crear_cuenta.html')


@app.route('/agregar', methods=['POST'])
def agregar():

    usuario = request.form['usuario']
    correo = request.form['correo']
    password = request.form['password']
    rol = "Cliente"

    cursor = conexion.cursor()

    consulta = """INSERT INTO usuarios (nombre_usuario, correo, contrasena, rol) VALUES (%s, %s, %s, %s)"""

    cursor.execute(consulta, (usuario, correo, password, rol))

    conexion.commit()

    cursor.close()

    return render_template('login.html', mensaje="Cuenta creada correctamente")


if __name__ == '__main__':
    crear_tabla_ventas()
    app.run()