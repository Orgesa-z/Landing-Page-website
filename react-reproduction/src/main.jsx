import React from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App.jsx";
import "./styles.css";

const theme = createTheme({
  palette: {
    primary: { main: "#173c34" },
    secondary: { main: "#d6f496" },
    background: { default: "#f7f8f5", paper: "#ffffff" },
    text: { primary: "#173c34", secondary: "#71817b" }
  },
  typography: {
    fontFamily: '"DM Sans", Arial, sans-serif',
    button: { textTransform: "none", fontWeight: 700 }
  },
  shape: { borderRadius: 8 }
});

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
