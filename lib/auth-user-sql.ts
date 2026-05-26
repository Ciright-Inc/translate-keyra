/** Display label for Ciright Core auth_users (full_name, email, phone). */
export const AUTH_USER_FROM_DISPLAY =
  "COALESCE(NULLIF(TRIM(fu.full_name), ''), NULLIF(TRIM(fu.email), ''), NULLIF(fu.phone::text, ''), 'User ' || fu.id::text)";
export const AUTH_USER_TO_DISPLAY =
  "COALESCE(NULLIF(TRIM(tu.full_name), ''), NULLIF(TRIM(tu.email), ''), NULLIF(tu.phone::text, ''), 'User ' || tu.id::text)";
export const AUTH_USER_U_DISPLAY =
  "COALESCE(NULLIF(TRIM(u.full_name), ''), NULLIF(TRIM(u.email), ''), NULLIF(u.phone::text, ''), 'User ' || u.id::text)";
