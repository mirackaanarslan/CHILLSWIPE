// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PredictionMarket {
    struct Question {
        string title;
        string description;
        string[] options;
        bool isActive;
        uint256 endTime;
        uint256 winningOption; // index of winning option
        bool resolved;
    }

    struct Bet {
        address user;
        uint256 amount;
        uint256 option;
        bool claimed;
    }

    address public admin;
    uint256 public questionCount;
    mapping(uint256 => Question) public questions;
    mapping(uint256 => Bet[]) public bets; // questionId => bets

    event QuestionCreated(uint256 indexed questionId, string title, string[] options, uint256 endTime);
    event BetPlaced(uint256 indexed questionId, address indexed user, uint256 option, uint256 amount);
    event QuestionResolved(uint256 indexed questionId, uint256 winningOption);
    event PayoutClaimed(uint256 indexed questionId, address indexed user, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier questionActive(uint256 questionId) {
        require(questions[questionId].isActive, "Not active");
        require(block.timestamp < questions[questionId].endTime, "Betting closed");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // 1. Soru oluştur (sadece admin)
    function createQuestion(
        string memory _title,
        string memory _description,
        string[] memory _options,
        uint256 _endTime
    ) external onlyAdmin {
        require(_options.length >= 2, "At least 2 options");
        require(_endTime > block.timestamp, "End time in future");

        questions[questionCount] = Question({
            title: _title,
            description: _description,
            options: _options,
            isActive: true,
            endTime: _endTime,
            winningOption: 0,
            resolved: false
        });

        emit QuestionCreated(questionCount, _title, _options, _endTime);
        questionCount++;
    }

    // 2. Bahis yap (herkes)
    function placeBet(uint256 questionId, uint256 option) external payable questionActive(questionId) {
        require(option < questions[questionId].options.length, "Invalid option");
        require(msg.value > 0, "No bet");

        bets[questionId].push(Bet({
            user: msg.sender,
            amount: msg.value,
            option: option,
            claimed: false
        }));

        emit BetPlaced(questionId, msg.sender, option, msg.value);
    }

    // 3. Soru çözümü (admin/oracle)
    function resolveQuestion(uint256 questionId, uint256 winningOption) external onlyAdmin {
        Question storage q = questions[questionId];
        require(q.isActive, "Already resolved");
        require(block.timestamp >= q.endTime, "Not ended");
        require(winningOption < q.options.length, "Invalid option");

        q.isActive = false;
        q.resolved = true;
        q.winningOption = winningOption;

        emit QuestionResolved(questionId, winningOption);
    }

    // 4. Kazananlar payout alır
    function claimPayout(uint256 questionId) external {
        Question storage q = questions[questionId];
        require(q.resolved, "Not resolved");

        uint256 totalPool = 0;
        uint256 winnerPool = 0;

        // Pool hesapla
        for (uint256 i = 0; i < bets[questionId].length; i++) {
            totalPool += bets[questionId][i].amount;
            if (bets[questionId][i].option == q.winningOption) {
                winnerPool += bets[questionId][i].amount;
            }
        }

        require(winnerPool > 0, "No winners");

        // Kullanıcının payout'u
        uint256 payout = 0;
        for (uint256 i = 0; i < bets[questionId].length; i++) {
            Bet storage b = bets[questionId][i];
            if (b.user == msg.sender && b.option == q.winningOption && !b.claimed) {
                payout += (b.amount * totalPool) / winnerPool;
                b.claimed = true;
            }
        }

        require(payout > 0, "Nothing to claim");
        payable(msg.sender).transfer(payout);

        emit PayoutClaimed(questionId, msg.sender, payout);
    }

    // Kullanıcı bahislerini görüntüleme (frontend için)
    function getUserBets(uint256 questionId, address user) external view returns (Bet[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < bets[questionId].length; i++) {
            if (bets[questionId][i].user == user) {
                count++;
            }
        }
        Bet[] memory result = new Bet[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < bets[questionId].length; i++) {
            if (bets[questionId][i].user == user) {
                result[idx++] = bets[questionId][i];
            }
        }
        return result;
    }
} 