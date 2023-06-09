const bodyParser = require("body-parser");
const express = require("express");
const dbConnect = require("./config/dbConnect");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const app = express();
const dotenv = require("dotenv").config();
const PORT = process.env.PORT || 4000;
const authRouter = require("./routes/authRoute");
const produtoRouter = require("./routes/produtoRoute");
const blogRouter = require("./routes/blogRoute");
const categoriaRouter = require("./routes/prodcategoriaRoute");
const blogCategoriaRouter = require("./routes/blogCatRoute");
const marcaRouter = require("./routes/marcaRoute");
const aplicacaoRouter = require("./routes/aplicacaoRoute");
const pergRouter = require("./routes/pergRoute");
const cupomRouter = require("./routes/cupomRoute");
const uploadRouter = require("./routes/uploadRoute");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
dbConnect();

app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/api/user", authRouter);
app.use("/api/produtos", produtoRouter);
app.use("/api/blog", blogRouter);
app.use("/api/categoria", categoriaRouter);
app.use("/api/blogcategoria", blogCategoriaRouter);
app.use("/api/marca", marcaRouter);
app.use("/api/cupom", cupomRouter);
app.use("/api/aplicacao", aplicacaoRouter);
app.use("/api/pergunta", pergRouter);
app.use("/api/upload", uploadRouter);


app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor está rodando na PORT ${PORT}`);
});
