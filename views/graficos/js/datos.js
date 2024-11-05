// Hacer una solicitud al servidor para obtener los datos
fetch("/datos")
  .then((response) => response.json())
  .then((data) => {
    // Actualizar los divs con los datos recibidos
    document.getElementById("ventasMes").innerText = " Bs. " + data.ventasMes;
    document.getElementById("ventasSemana").innerText =
      data.ventasSemana + " ventas";
    document.getElementById("clientesRegistradosMes").innerText =
      data.clientesRegistradosMes;
    document.getElementById("medicamentosapuntovencer").innerText =
      data.medicamentosapuntovencer;
    document.getElementById("obtenerVentasMest").innerText =
      data.obtenerVentasMest;
    document.getElementById("obtenerProductoMasVendido").innerText =
      data.obtenerProductoMasVendido || "No hay ventas este año"; // Manejar el caso null
    document.getElementById(
      "obtenerTotalProductosVendidosMesSucursal"
    ).innerText =
      data.obtenerTotalProductosVendidosMesSucursal || "No hay ventas este mes";
    document.getElementById("obtenerCantidadTotalInventario").innerText =
      data.obtenerCantidadTotalInventario || "Inventario vacio"; // Manejar el caso null
    document.getElementById("obtenerProveedorMasComprado").innerText =
      data.obtenerProveedorMasComprado || "no hay proveedores"; // Manejar el caso null
    document.getElementById("obtenerTotalComprasC").innerText =
      data.obtenerTotalComprasC + " Bs." || "No hay compras";
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });
