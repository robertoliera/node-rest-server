const express = require("express");
const bcrypt = require("bcrypt");
const _ = require("underscore");
const User = require("../models/user");
const { response } = require("express");
const app = express();

const {
  verificaToken,
  verificaAdmin_Role,
} = require("../middlewares/autenticacion");

app.get("/usuario", verificaToken, (req, res) => {
  let page = req.query.page - 1 || 0;
  page = Number(page);

  let page_size = req.query.page_size || 5;
  page_size = Number(page_size);

  User.find({ estado: true }, "nombre email img role estado google")
    .skip(page_size * page)
    .limit(page_size)
    .exec((err, usuarios) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          err,
        });
      }

      User.countDocuments({ estado: true }, (err, conteo) => {
        res.json({
          ok: true,
          usuarios,
          cuantos: conteo,
        });
      });
    });
});

app.post("/usuario", [verificaToken, verificaAdmin_Role], (req, res) => {
  let body = req.body;

  let usuario = new User({
    nombre: body.nombre,
    email: body.email,
    password: bcrypt.hashSync(body.password, 10),
    role: body.role,
  });

  usuario.save((err, usuarioDB) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        err,
      });
    }

    res.json({
      ok: true,
      usuario: usuarioDB,
    });
  });
});

app.put("/usuario/:id", [verificaToken, verificaAdmin_Role], (req, res) => {
  let id = req.params.id;
  let body = _.pick(req.body, ["nombre", "email", "img", "role", "estado"]);

  User.findByIdAndUpdate(
    id,
    body,
    { new: true, runValidators: true },
    (err, usuarioDB) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          err,
        });
      }

      res.json({
        ok: true,
        usuario: usuarioDB,
      });
    }
  );
});

app.delete("/usuario/:id", [verificaToken, verificaAdmin_Role], (req, res) => {
  let id = req.params.id;

  //Borrado fisico
  /* User.findByIdAndRemove(id, (err, usuarioBorrado) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        err,
      });
    }

    if (!usuarioBorrado) {
      return res.status(400).json({
        ok: false,
        err: {
          message: "Usuario no encontrado",
        },
      });
    }

    res.json({
      ok: true,
      usuario: usuarioBorrado,
    });
  }); */

  //Borrado lógico
  let cambiaEstado = {
    estado: false,
  };

  User.findByIdAndUpdate(
    id,
    cambiaEstado,
    { new: true },
    (err, usuarioBorrado) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          err,
        });
      }

      if (!usuarioBorrado) {
        return res.status(400).json({
          ok: false,
          err: {
            message: "Usuario no encontrado",
          },
        });
      }

      res.json({
        ok: true,
        usuario: usuarioBorrado,
      });
    }
  );
});

module.exports = app;
