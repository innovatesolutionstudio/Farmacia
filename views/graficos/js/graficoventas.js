async function verDetallesVentasG() {
    try {
        const response = await fetch('/datos');
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        const { ventasMesActual } = await response.json();

        const meses = ventasMesActual.map(venta => venta.Mes);
        const totales = ventasMesActual.map(venta => venta.Total_Venta);

        // Crear la tabla que solo muestra Mes y Venta Total
        let tabla = `
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #ccc;">
                <th style="padding: 8px; text-align: left;">Mes</th>
                <th style="padding: 8px; text-align: left;">Venta Total</th>
              </tr>
            </thead>
            <tbody>
        `;

        ventasMesActual.forEach(venta => {
            tabla += `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px;">${venta.Mes}</td>
                <td style="padding: 8px;">${venta.Total_Venta} Bs.</td>
              </tr>
            `;
        });

        tabla += `</tbody></table>`;

        // Crear el gráfico
        let graficoHTML = `<canvas id="ventasMesChart" width="400" height="400"></canvas>`;

        // Mostrar la ventana emergente con el gráfico a la izquierda y la tabla a la derecha
        await Swal.fire({
            title: '<strong>Ventas de toda la Gestion </strong><br>',
            html: `
              <div style="display: flex; justify-content: space-between; gap: 20px;">
                <div style="flex: 1; padding: 10px;">
                  ${graficoHTML}
                </div>
                <div style="flex: 1; padding: 10px; overflow-y: auto; max-height: 500px;">
                  ${tabla}
                </div>
              </div>
            `,
            showCloseButton: true,
            confirmButtonText: 'Aceptar',
            width: '95%', // Ajusta el ancho a 1000px
            heightAuto: false, // Asegura que la altura sea correcta
            didOpen: () => {
                // Inicializar el gráfico después de que el popup se haya abierto
                const ctx = document.getElementById('ventasMesChart').getContext('2d');
                new Chart(ctx, {
                    type: 'line', // Tipo de gráfico
                    data: {
                        labels: meses,
                        datasets: [{
                            label: 'Ventas por Mes',
                            data: totales,
                            fill: true,
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1,
                            pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: 'rgba(75, 192, 192, 1)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
        });

    } catch (err) {
        console.error('Error al cargar las ventas del mes:', err);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar las ventas del mes.',
        });
    }
}
