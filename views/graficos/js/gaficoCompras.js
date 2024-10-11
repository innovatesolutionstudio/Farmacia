async function verProductosCompradosMes() {
    try {
        const response = await fetch('/datos');
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        const { obtenerTotalComprasGR } = await response.json();

        const meses = obtenerTotalComprasGR.map(compra => compra.Mes); // Ahora contiene nombres de meses
        const totales = obtenerTotalComprasGR.map(compra => compra.Total_Productos_Vendidos);

        // Crear la tabla que solo muestra Mes y Total de Productos Comprados
        let tabla = `
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #ccc;">
                <th style="padding: 8px; text-align: left;">Mes</th>
                <th style="padding: 8px; text-align: left;">Total Productos Comprados</th>
              </tr>
            </thead>
            <tbody>
        `;

        obtenerTotalComprasGR.forEach(compra => {
            tabla += `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px;">${compra.Mes}</td>
                <td style="padding: 8px;">${compra.Total_Productos_Vendidos}</td>
              </tr>
            `;
        });

        tabla += `</tbody></table>`;

        // Crear el gráfico
        let graficoHTML = `<canvas id="productosCompradosChart" width="400" height="400"></canvas>`;

        // Mostrar la ventana emergente con el gráfico a la izquierda y la tabla a la derecha
        await Swal.fire({
            title: '<strong>Total de Productos Comprados por Mes</strong>',
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
                const ctx = document.getElementById('productosCompradosChart').getContext('2d');
                new Chart(ctx, {
                    type: 'bar', // Tipo de gráfico
                    data: {
                        labels: meses,
                        datasets: [{
                            label: 'Total Productos Comprados',
                            data: totales,
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
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
        console.error('Error al cargar los productos comprados por mes:', err);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los productos comprados por mes.',
        });
    }
}
