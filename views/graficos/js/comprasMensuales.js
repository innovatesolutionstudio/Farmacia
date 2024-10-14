async function verDetallesCompras() {
    try {
      const response = await fetch('/datos');
      const { comprasMestabla } = await response.json(); // Obtener datos de compras desde el backend
  
      // Mapeo de los días de la semana
      const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  
      // Función para formatear la fecha
      const formatearFecha = (fechaString) => {
        const fecha = new Date(fechaString);
        return fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      };
  
      // Creación de la tabla con clases de Bootstrap
      let tabla = `
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Día</th>
              <th>Total Compra</th>
            </tr>
          </thead>
          <tbody>
      `;
  
      // Comprobar si hay datos
      if (comprasMestabla.length === 0) {
        tabla += `<tr><td colspan="3" class="text-center">No hay datos disponibles.</td></tr>`;
      } else {
        comprasMestabla.forEach(compra => {
          const nombreDia = diasSemana[compra.Dia]; // Convertir número del día a nombre del día
          const fechaFormateada = formatearFecha(compra.Fecha); // Formatear la fecha
          tabla += `
            <tr>
              <td>${fechaFormateada}</td>
              <td>${nombreDia}</td>
              <td>${compra.Total_Compra}</td>
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
        title: 'Compras del Mes',
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
        text: 'No se pudieron cargar las compras del mes.',
      });
    }
  }
  