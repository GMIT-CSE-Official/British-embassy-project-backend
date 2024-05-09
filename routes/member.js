const Router = require("express");
const {
  addMember,
  updateMember,
  deleteMember,
  getAllMembers,
  searchMember,
  updateImage,
} = require("../controller/member");
const {
  isAuthenticated,
  isInClub,
  isOperator,
  isUser,
} = require("../middleware/auth");
const { validateAddMember } = require("../middleware/zod-user-middleware");
const router = Router();

router.post(
  "/add-member",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  validateAddMember,
  addMember
);
router.put(
  "/update-member/:memberId",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  updateMember
);
router.put(
  "/update-member-image/:memberId",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  updateImage
);
router.delete(
  "/delete-member/:memberId",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  deleteMember
);
router.get(
  "/all-members",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  getAllMembers
);
router.get(
  "/search-member/:key",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  searchMember
);

module.exports = router;
