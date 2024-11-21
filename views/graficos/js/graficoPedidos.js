async function verPedidosMensualesAno() {
    try {
        const response = await fetch('/datos');
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        const { obtenerPedidosAnoActual_m } = await response.json();
     

        const meses = obtenerPedidosAnoActual_m.map(pedido => pedido.Mes); // Obtiene los nombres de los meses
        const totales = obtenerPedidosAnoActual_m.map(pedido => pedido.Total_Pedidos); // Obtiene los totales de pedidos

        // Crear la tabla que muestra Mes y Total de Pedidos
        let tabla = `
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #ccc;">
                <th style="padding: 8px; text-align: left;">Mes</th>
                <th style="padding: 8px; text-align: left;">Total Pedidos</th>
              </tr>
            </thead>
            <tbody>
        `;

        obtenerPedidosAnoActual_m.forEach(pedido => {
            tabla += `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px;">${pedido.Mes}</td>
                <td style="padding: 8px;">${pedido.Total_Pedidos}</td>
              </tr>
            `;
        });

        tabla += `</tbody></table>`;

        // Crear el gráfico
        let graficoHTML = `<canvas id="pedidosMensualesChart" width="400" height="400"></canvas>`;

        // Mostrar la ventana emergente con el gráfico a la izquierda y la tabla a la derecha
        await Swal.fire({
            title: '<strong>Total de Pedidos por Mes</strong>',
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
            width: '95%', // Ajusta el ancho
            heightAuto: false, // Asegura que la altura sea correcta
            didOpen: () => {
                // Inicializar el gráfico después de que el popup se haya abierto
                const ctx = document.getElementById('pedidosMensualesChart').getContext('2d');
                new Chart(ctx, {
                    type: 'bar', // Tipo de gráfico
                    data: {
                        labels: meses,
                        datasets: [{
                            label: 'Total Pedidos',
                            data: totales,
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            borderColor: 'rgba(54, 162, 235, 1)',
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
        console.error('Error al cargar los pedidos mensuales:', err);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los pedidos mensuales.',
        });
    }
}
