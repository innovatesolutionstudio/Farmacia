async function verDetallesClientes() {
    try {
      const response = await fetch('/datos');
      const { ventasMesGrafico } = await response.json();
  
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
              <th>Clientes Totales</th>
            </tr>
          </thead>
          <tbody>
      `;
  
      // Comprobar si hay datos
      if (ventasMesGrafico.length === 0) {
        tabla += `<tr><td colspan="4" class="text-center">No hay datos disponibles.</td></tr>`;
      } else {
        ventasMesGrafico.forEach(venta => {
          const nombreDia = diasSemana[venta.Dia]; // Convertir número del día a nombre del día
          const fechaFormateada = formatearFecha(venta.Fecha); // Formatear la fecha
          tabla += `
            <tr>
              <td>${fechaFormateada}</td>
              <td>${nombreDia}</td>
              <td>${venta.Clientes}</td>
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
        title: 'Clientes Registrados en el Mes',
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
        text: 'No se pudieron cargar las ventas del mes.',
      });
    }
  }