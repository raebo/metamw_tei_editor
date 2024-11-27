import Typography from "@mui/material/Typography";
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import * as React from "react";
import router from "../Routes";
import { useNavigate } from "react-router-dom";
import useReactiveVar from "../../utils/makeReactiveVar";
import { authenticatedVar } from "../../constants/authenticated";
import { useAuthToken } from "../../services/authentication.service";

const Branding = () => {

  const isAuthenticated = useReactiveVar(authenticatedVar).get()

  const navigate = useNavigate()
  return (
    <>
      <QuestionAnswerIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
      <Typography
        variant="h6"
        noWrap
        component="a"
        onClick={ () => navigate("/") }
        sx={{
          mr: 2,
          display: { xs: 'none', md: 'flex' },
          fontFamily: 'monospace',
          cursor: 'pointer',
          fontWeight: 700,
          letterSpacing: '.3rem',
          color: 'inherit',
          textDecoration: 'none',
        }}
        >
        {`${isAuthenticated.get() ? 'MetaMw - Editor' : 'MetaMw - Editor'}`}
      </Typography>
    </>
  )
}

export default Branding;