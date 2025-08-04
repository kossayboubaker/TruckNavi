function configs(labels, datasets) {
  return {
    data: {
      labels,
      datasets: datasets.map(ds => ({
        label: ds.label,
        tension: 0.4,
        pointRadius: 5,
        pointBorderColor: "transparent",
        pointBackgroundColor: ds.pointBackgroundColor || "rgba(255, 255, 255, .8)",
        borderColor: ds.borderColor || "rgba(255, 255, 255, .8)",
        borderWidth: 3,
        backgroundColor: ds.backgroundColor || "transparent",
        fill: ds.fill !== undefined ? ds.fill : true,
        data: ds.data,
        maxBarThickness: 6,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true, // affiche la légende si plusieurs datasets
          labels: {
            color: "#f8f9fa",
          }
        },
      },
      interaction: {
        intersect: false,
        mode: "index",
      },
      scales: {
        y: {
          grid: {
            drawBorder: false,
            display: true,
            drawOnChartArea: true,
            drawTicks: false,
            borderDash: [5, 5],
            color: "rgba(255, 255, 255, .2)",
          },
          ticks: {
            display: true,
            color: "#f8f9fa",
            padding: 10,
            font: {
              size: 14,
              weight: 300,
              family: "Roboto",
              style: "normal",
              lineHeight: 2,
            },
          },
        },
        x: {
          grid: {
            drawBorder: false,
            display: false,
            drawOnChartArea: false,
            drawTicks: false,
            borderDash: [5, 5],
          },
          ticks: {
            display: true,
            color: "#f8f9fa",
            padding: 10,
            autoSkip: false,
            maxRotation: 45,
            minRotation: 45,
            font: {
              size: 14,
              weight: 300,
              family: "Roboto",
              style: "normal",
              lineHeight: 2,
            },
          },
        },
      },
    },
  };
}

export default configs;
