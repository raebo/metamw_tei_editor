import Button from '@mui/material/Button';
import { Snackbar as MUISnackbar, SnackbarCloseReason } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import React, { Fragment, useState } from "react";
import { snackVar } from "../../constants/snack";
import { enqueueSnackbar, SnackbarProvider } from "notistack";
import useReactiveVar from "../../utils/makeReactiveVar";

const Snackbar = () => {
  const [open, setOpen] = useState(false);
  const snack = useReactiveVar(snackVar).get()

  const handleClick = () => {
    setOpen(true);
  };

  // const addSnack = () => {
  //   if (snack) {
  //     enqueueSnackbar(snack.message, { variant: snack.type });
  //     setOpen(true);
  //   }
  // }


  const handleClose = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  const action = (
    <Fragment>
      <Button color="secondary" size="small" onClick={handleClose}>
        UNDO
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Fragment>
  );

  return (
    <SnackbarProvider maxSnack={3}>
      <MUISnackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        message="Note archived"
        action={action}
      />
    </SnackbarProvider>
  );
}

export default Snackbar;