const { generateToken } = require("../config/jwtToken");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const validadeMongodbid = require("../utils/validadeMongodbid");
const { generateRefreshToken } = require("../config/refreshtoken");
const jwt = require("jsonwebtoken");
const sendEmail = require("./emailController");
const crypto = require("crypto");

// Cria usuário
const createUser = asyncHandler(async (req, res) => {
  const email = req.body.email;
  const findUser = await User.findOne({ email: email });
  if (!findUser) {
    // Cria um novo usuário
    const newUser = await User.create(req.body);
    res.json(newUser);
  } else {
    throw new Error("Usuário já existe");
  }
});

// Login do usuário
const loginUserController = asyncHandler(async (req, res) => {
  const { email, senha } = req.body;
  // Verifica se o usuário existe ou não
  const findUser = await User.findOne({ email });
  if (findUser && (await findUser.isPasswordMatched(senha))) {
    const refreshToken = await generateRefreshToken(findUser?._id);
    const updateuser = await User.findByIdAndUpdate(
      findUser.id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });

    res.json({
      _id: findUser?._id,
      primeiroNome: findUser?.primeiroNome,
      ultimoNome: findUser?.ultimoNome,
      email: findUser.email,
      telefone: findUser?.telefone,
      token: generateToken(findUser?._id),
    });
  } else {
    throw new Error("Credenciais inválidas");
  }
});

// Login do admin
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, senha } = req.body;
  // Verifica se o usuário existe ou não
  const findAdmin = await User.findOne({ email });
  if (findAdmin.role !== "Admin") throw new Error("Não autorizado");
  if (findAdmin && (await findAdmin.isPasswordMatched(senha))) {
    const refreshToken = await generateRefreshToken(findAdmin?._id);
    const updateuser = await User.findByIdAndUpdate(
      findAdmin.id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });

    res.json({
      _id: findAdmin?._id,
      primeiroNome: findAdmin?.primeiroNome,
      ultimoNome: findAdmin?.ultimoNome,
      email: findAdmin.email,
      telefone: findAdmin?.telefone,
      token: generateToken(findAdmin?._id),
    });
  } else {
    throw new Error("Credenciais inválidas");
  }
});

// Handle refresh token
const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken)
    throw new Error("Nenhum token de atualização em cookies");
  const refreshToken = cookie.refreshToken;
  console.log(refreshToken);
  const user = await User.findOne({ refreshToken });
  if (!user)
    throw new Error(
      "Nenhum token de atualização presente no banco de dados ou não correspondido"
    );
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      throw new Error("Há algo errado com o token de atualização");
    }
    const accessToken = generateToken(user?._id);
    res.json({ accessToken });
  });
});

// Funcionalidade Logout
const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    return res.sendStatus(204); // forbidden
  }
  await User.findOneAndUpdate(refreshToken, {
    refreshToken: "",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });
  res.sendStatus(204); // forbidden
});

// Atualizando usuário
const updatedUser = asyncHandler(async (req, res) => {
  console.log();
  const { _id } = req.user;
  validadeMongodbid(_id);
  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        primeiroNome: req?.body?.primeiroNome,
        ultimoNome: req?.body?.ultimoNome,
        email: req?.body?.email,
        telefone: req?.body?.telefone,
      },
      {
        new: true,
      }
    );
    res.json(updatedUser);
  } catch (error) {
    throw new Error(error);
  }
});

// Obtendo todos os usuários
const getallUsers = asyncHandler(async (req, res) => {
  try {
    const getUsers = await User.find();
    res.json(getUsers);
  } catch (error) {
    throw new Error(error);
  }
});

// Obtendo um unico usuário
const getaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validadeMongodbid(id);
  try {
    const getaUser = await User.findById(id);
    res.json({
      getaUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Deletando usuário
const deleteaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validadeMongodbid(id);
  try {
    const deleteaUser = await User.findByIdAndDelete(id);
    res.json({
      deleteaUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Bloqueia usuário
const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validadeMongodbid(id);
  try {
    const blockusr = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: true,
      },
      {
        new: true,
      }
    );
    res.json(blockusr);
  } catch (error) {
    throw new Error(error);
  }
});

//Desbloqueia usuário
const unblockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validadeMongodbid(id);
  try {
    const unblock = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
      },
      {
        new: false,
      }
    );
    res.json(unblock);
  } catch (error) {
    throw new Error(error);
  }
});

//Atualiza senha
const updateSenha = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { senha } = req.body;
  validadeMongodbid(_id);
  const user = await User.findById(_id);
  if (senha) {
    user.senha = senha;
    const updatedSenha = await user.save();
    res.json(updatedSenha);
  } else {
    res.json(user);
  }
});

//Esqueci token de senha
const forgotSenhaToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new Error("Usuário não encontrado com este e-mail");
  try {
    const token = await user.createPasswordResetToken();
    await user.save();
    const resetURL = `Olá, siga este link para redefinir sua senha. Este link é válido até 10 minutos a partir de agora. <a href='http://localhost:5000/api/user/reset-senha/${token}'>Click Here</>`;
    const data = {
      to: email,
      text: "Ei usuário",
      subject: "Link para trocar senha",
      htm: resetURL,
    };
    sendEmail(data);
    res.json(token);
  } catch (error) {
    throw new Error(error);
  }
});

const resetSenha = asyncHandler(async (req, res) => {
  const { senha } = req.body;
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error("Token expirado, tente novamente mais tarde");
  user.senha = senha;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json(user);
});

const getListaDesejo = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const findUser = await User.findById(_id).populate("ListadeDesejos");
    res.json(findUser);
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
  createUser,
  loginUserController,
  getallUsers,
  getaUser,
  deleteaUser,
  updatedUser,
  blockUser,
  unblockUser,
  handleRefreshToken,
  logout,
  updateSenha,
  forgotSenhaToken,
  resetSenha,
  loginAdmin,
  getListaDesejo,
};
