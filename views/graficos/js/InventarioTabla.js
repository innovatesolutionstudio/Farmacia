async function verDetallesInventario() {
    try {
      const response = await fetch('/datos');
      const { ObtenerTablaInventarios } = await response.json();
  
      // Creación de la tabla con clases de Bootstrap
      let tabla = `
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Nombre del Producto</th>
              <th>Cantidad en Inventario</th>
            </tr>
          </thead>
          <tbody>
      `;
  
      // Comprobar si hay datos
      if (ObtenerTablaInventarios.length === 0) {
        tabla += `<tr><td colspan="2" class="text-center">No hay productos con menos de 5 unidades.</td></tr>`;
      } else {
        ObtenerTablaInventarios.forEach(producto => {
          tabla += `
            <tr>
              <td>${producto.Nombre}</td>
              <td>${producto.Cantidad}</td>
            </tr>
          `;
        });
      }
  
      tabla += `
          </tbody>
        </table>
      `;
  
      // Mostrar la ventana con tamaño personalizado
      await Swal.fire({
        title: 'Productos con menos de 5 unidades',
        html: tabla,
        showCloseButton: true,
        confirmButtonText: 'Aceptar',
        customClass: {
          popup: 'wide-popup' // Clase personalizada para ajustar el ancho
        }
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los productos del inventario.',
      });
    }
  }
  