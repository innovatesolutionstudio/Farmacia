const productoFiltro = document.getElementById("productoFiltro");
const dropdownProductos = document.getElementById("dropdownProductos");

productoFiltro.addEventListener("input", async function () {
  const searchTerm = productoFiltro.value.trim();

  if (searchTerm.length === 0) {
    dropdownProductos.style.display = "none";
    dropdownProductos.innerHTML = "";
    return;
  }

  const url = `/buscar_productos?q=${encodeURIComponent(searchTerm)}`;

  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      mostrarResultados(data);
    } else {
      throw new Error("Error al buscar productos");
    }
  } catch (error) {
    console.error("Error al obtener productos:", error);
  }
});

function mostrarResultados(productos) {
  dropdownProductos.innerHTML = "";

  if (productos.length === 0) {
    dropdownProductos.style.display = "none";
    return;
  }

  productos.forEach((producto) => {
    const option = document.createElement("div");
    option.classList.add("dropdown-item");
    option.textContent = `${producto.NombreProducto} - ${producto.UnidadVenta}`;
    option.addEventListener("click", function () {
      productoFiltro.value = `${producto.NombreProducto} - ${producto.UnidadVenta}`;
      dropdownProductos.style.display = "none";
    });
    dropdownProductos.appendChild(option);
  });

  dropdownProductos.style.display = "block";
}

// Cerrar el menú desplegable al hacer clic fuera de él
document.addEventListener("click", function (event) {
  const isClickInside =
    dropdownProductos.contains(event.target) ||
    productoFiltro.contains(event.target);
  if (!isClickInside) {
    dropdownProductos.style.display = "none";
  }
});
