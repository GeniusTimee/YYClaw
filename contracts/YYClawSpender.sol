// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title YYClawSpender
 * @notice Collects ERC20 payments from users who have approved this contract.
 *         Only the designated operator can call collectPayment.
 */
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

contract YYClawSpender {
    address public owner;
    address public operator;  // The hot wallet that calls collectPayment
    address public treasury;  // Where collected tokens go

    event PaymentCollected(address indexed from, address indexed token, uint256 amount, bytes32 callId);
    event OperatorChanged(address indexed oldOperator, address indexed newOperator);
    event TreasuryChanged(address indexed oldTreasury, address indexed newTreasury);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyOperator() {
        require(msg.sender == operator, "not operator");
        _;
    }

    constructor(address _operator, address _treasury) {
        owner = msg.sender;
        operator = _operator;
        treasury = _treasury;
    }

    /**
     * @notice Collect payment from a user. Called by operator after successful AI API call.
     * @param from     User's wallet address
     * @param token    ERC20 token address (USD1, USDT, USDC, etc.)
     * @param amount   Amount in token's smallest unit (wei)
     * @param callId   Unique identifier for the API call (for logging)
     */
    function collectPayment(
        address from,
        address token,
        uint256 amount,
        bytes32 callId
    ) external onlyOperator returns (bool) {
        require(amount > 0, "zero amount");
        require(IERC20(token).allowance(from, address(this)) >= amount, "insufficient allowance");
        require(IERC20(token).balanceOf(from) >= amount, "insufficient balance");

        bool success = IERC20(token).transferFrom(from, treasury, amount);
        require(success, "transfer failed");

        emit PaymentCollected(from, token, amount, callId);
        return true;
    }

    /**
     * @notice Check if a user has sufficient allowance and balance for a payment.
     * @return hasAllowance Whether allowance >= amount
     * @return hasBalance   Whether balance >= amount
     * @return allowanceAmt Current allowance
     * @return balanceAmt   Current balance
     */
    function checkPayable(
        address from,
        address token,
        uint256 amount
    ) external view returns (bool hasAllowance, bool hasBalance, uint256 allowanceAmt, uint256 balanceAmt) {
        allowanceAmt = IERC20(token).allowance(from, address(this));
        balanceAmt = IERC20(token).balanceOf(from);
        hasAllowance = allowanceAmt >= amount;
        hasBalance = balanceAmt >= amount;
    }

    // ─── Admin ────────────────────────────────────────────

    function setOperator(address _operator) external onlyOwner {
        emit OperatorChanged(operator, _operator);
        operator = _operator;
    }

    function setTreasury(address _treasury) external onlyOwner {
        emit TreasuryChanged(treasury, _treasury);
        treasury = _treasury;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        emit OwnerChanged(owner, _newOwner);
        owner = _newOwner;
    }
}
