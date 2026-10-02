/**
 * Admin resets a user's password. Clears the user's sessions server-side.
 */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import * as userService from '../../services/userService.js';
import { useApiMutation } from '../../hooks/api';
import { Button, Input, Modal } from '../ui';

const ResetPasswordModal = ({ open, onClose, user }) => {
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (open) setPassword('');
  }, [open]);

  const resetPassword = useApiMutation(userService.resetPassword, {
    successMessage: 'Password reset',
    onSuccess: () => onClose(),
  });

  if (!user) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Reset password — ${user.username}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => resetPassword.mutate({ id: user.id, newPassword: password })}
            loading={resetPassword.isPending}
            disabled={password.length < 8}
          >
            Reset password
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-muted">
        The user will be signed out of all sessions and must log in with the
        new password.
      </p>
      <Input
        label="New password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        helperText="Min 8 characters"
        autoComplete="new-password"
        autoFocus
      />
    </Modal>
  );
};

ResetPasswordModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
};

export default ResetPasswordModal;
