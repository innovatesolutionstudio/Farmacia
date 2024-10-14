async function verProductosVendidosMes() {
    try {
        const response = await fetch('/datos');
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        const { productosVendidosMes } = await response.json();

        const meses = productosVendidosMes.map(producto => producto.Mes);
        const totales = productosVendidosMes.map(producto => producto.Total_Productos_Vendidos);

        // Crear la tabla que solo muestra Mes y Total de Productos Vendidos
        let tabla = `
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #ccc;">
                <th style="padding: 8px; text-align: left;">Mes</th>
                <th style="padding: 8px; text-align: left;">Total Productos Vendidos</th>
              </tr>
            </thead>
            <tbody>
        `;

        productosVendidosMes.forEach(producto => {
            tabla += `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px;">${producto.Mes}</td>
                <td style="padding: 8px;">${producto.Total_Productos_Vendidos}</td>
              </tr>
            `;
        });

        tabla += `</tbody></table>`;

        // Crear el gráfico
        let graficoHTML = `<canvas id="productosVendidosChart" width="400" height="400"></canvas>`;

        // Mostrar la ventana emergente con el gráfico a la izquierda y la tabla a la derecha
        await Swal.fire({
            title: '<strong>Total de Productos Vendidos por Mes</strong>',
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
                const ctx = document.getElementById('productosVendidosChart').getContext('2d');
                new Chart(ctx, {
                    type: 'bar', // Tipo de gráfico
                    data: {
                        labels: meses,
                        datasets: [{
                            label: 'Total Productos Vendidos',
                            data: totales,
                            backgroundColor: 'rgba(153, 102, 255, 0.2)',
                            borderColor: 'rgba(153, 102, 255, 1)',
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
        console.error('Error al cargar los productos vendidos por mes:', err);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los productos vendidos por mes.',
        });
    }
}
