pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface BentoBoxV1 {
    event LogDeposit(
        IERC20 indexed token,
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 share
    );
    event LogWithdraw(
        IERC20 indexed token,
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 share
    );
    event LogTransfer(
        IERC20 indexed token,
        address indexed from,
        address indexed to,
        uint256 share
    );

    event LogFlashLoan(
        address indexed borrower,
        IERC20 indexed token,
        uint256 amount,
        uint256 feeAmount,
        address indexed receiver
    );

    event LogStrategyTargetPercentage(
        IERC20 indexed token,
        uint256 targetPercentage
    );
    event LogStrategyInvest(IERC20 indexed token, uint256 amount);
    event LogStrategyDivest(IERC20 indexed token, uint256 amount);
    event LogStrategyProfit(IERC20 indexed token, uint256 amount);
    event LogStrategyLoss(IERC20 indexed token, uint256 amount);
}
