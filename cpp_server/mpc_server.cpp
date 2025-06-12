#include <iostream>
#include <sstream>
#include <map>
#include <functional>
#include <string>
#include <ctime>
#include <cstdlib>

class MPCWalletServer {
private:
    int port_;
    std::map<std::string, std::function<std::string(const std::string&)>> routes_;

    std::string createSuccessResponse(const std::string& data, const std::string& message = "") {
        std::ostringstream json;
        json << "{\"success\":true,\"data\":" << data;
        if (!message.empty()) {
            json << ",\"message\":\"" << message << "\"";
        }
        json << "}";
        return json.str();
    }

    std::string createErrorResponse(const std::string& error, int code = 500) {
        std::ostringstream json;
        json << "{\"success\":false,\"error\":\"" << error << "\",\"code\":" << code << "}";
        return json.str();
    }

    void setupRoutes() {
        // 健康检查
        routes_["GET /health"] = [this](const std::string& body) -> std::string {
            auto now = std::time(nullptr);
            std::ostringstream data;
            data << "{\"status\":\"ok\",\"timestamp\":\"" << now 
                 << "\",\"version\":\"1.0.0\"}";
            return createSuccessResponse(data.str());
        };

        // 根路径信息
        routes_["GET /"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"message\":\"MPC 钱包C++后端服务运行中\","
                 << "\"version\":\"1.0.0\","
                 << "\"endpoints\":{"
                 << "\"wallet\":\"/api/wallet\","
                 << "\"transaction\":\"/api/transaction\","
                 << "\"mpc\":\"/api/mpc\","
                 << "\"blockchain\":\"/api/blockchain\","
                 << "\"health\":\"/health\""
                 << "}}";
            return createSuccessResponse(data.str());
        };

        setupWalletRoutes();
        setupTransactionRoutes();
        setupMpcRoutes();
        setupBlockchainRoutes();
    }

    void setupWalletRoutes() {
        // 创建钱包
        routes_["POST /api/wallet/create"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"walletId\":\"wallet_" << std::time(nullptr) 
                 << "\",\"participantCount\":2,\"threshold\":2,\"address\":\"0x" 
                 << std::hex << std::time(nullptr) << "...\"}";
            return createSuccessResponse(data.str(), "钱包创建成功");
        };

        // 导入钱包
        routes_["POST /api/wallet/import"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"walletId\":\"imported_wallet_" << std::time(nullptr) 
                 << "\",\"address\":\"0x" << std::hex << std::time(nullptr) << "...\"}";
            return createSuccessResponse(data.str(), "钱包导入成功");
        };

        // 获取钱包列表
        routes_["GET /api/wallet/list"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "[{\"walletId\":\"wallet_1\",\"address\":\"0xabc123...\",\"balance\":\"1.234\"},"
                 << "{\"walletId\":\"wallet_2\",\"address\":\"0xdef456...\",\"balance\":\"2.567\"}]";
            return createSuccessResponse(data.str());
        };

        // 获取钱包余额
        routes_["GET /api/wallet/balance"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"balance\":\"1.234567\",\"formatted\":\"1.2346 ETH\"}";
            return createSuccessResponse(data.str());
        };

        // 删除钱包
        routes_["DELETE /api/wallet/delete"] = [this](const std::string& body) -> std::string {
            return createSuccessResponse("{}", "钱包删除成功");
        };
    }

    void setupTransactionRoutes() {
        // 创建交易
        routes_["POST /api/transaction/create"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"transactionId\":\"tx_" << std::time(nullptr) 
                 << "\",\"status\":\"created\",\"from\":\"0xabc...\",\"to\":\"0xdef...\","
                 << "\"amount\":\"1.0\",\"gasLimit\":21000,\"gasPrice\":\"20000000000\"}";
            return createSuccessResponse(data.str(), "交易创建成功");
        };

        // 估算Gas费用
        routes_["POST /api/transaction/estimate-gas"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"gasLimit\":21000,\"gasPrice\":\"20000000000\",\"estimatedFee\":\"0.00042 ETH\"}";
            return createSuccessResponse(data.str());
        };

        // 获取Gas价格
        routes_["GET /api/transaction/gas-price"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"gasPrice\":\"20000000000\",\"gasPriceGwei\":\"20.0 Gwei\","
                 << "\"slow\":\"15.0 Gwei\",\"standard\":\"20.0 Gwei\",\"fast\":\"25.0 Gwei\"}";
            return createSuccessResponse(data.str());
        };

        // 广播交易
        routes_["POST /api/transaction/broadcast"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"transactionHash\":\"0x" << std::hex << std::time(nullptr) 
                 << "abc123def456789...\",\"status\":\"pending\"}";
            return createSuccessResponse(data.str(), "交易广播成功");
        };

        // 获取交易状态
        routes_["GET /api/transaction/status"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"transactionHash\":\"0xabc123...\",\"status\":\"confirmed\","
                 << "\"blockNumber\":18000000,\"confirmations\":12}";
            return createSuccessResponse(data.str());
        };

        // 获取交易历史
        routes_["GET /api/transaction/history"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"transactions\":[{\"hash\":\"0xabc...\",\"from\":\"0x123...\","
                 << "\"to\":\"0x456...\",\"amount\":\"1.0\",\"timestamp\":" << std::time(nullptr) 
                 << ",\"status\":\"confirmed\"}],\"total\":1,\"page\":1}";
            return createSuccessResponse(data.str());
        };
    }

    void setupMpcRoutes() {
        // 启动MPC密钥生成
        routes_["POST /api/mpc/keygen/start"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"sessionId\":\"mpc_session_" << std::time(nullptr) 
                 << "\",\"status\":\"started\",\"participantsRequired\":2,"
                 << "\"currentParticipants\":1,\"round\":1}";
            return createSuccessResponse(data.str(), "MPC 密钥生成启动成功");
        };

        // 加入MPC密钥生成
        routes_["POST /api/mpc/keygen/join"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"sessionId\":\"mpc_session_123\",\"participantId\":\"participant_" 
                 << std::time(nullptr) << "\",\"status\":\"joined\",\"round\":1}";
            return createSuccessResponse(data.str(), "MPC 密钥生成加入成功");
        };

        // 启动MPC签名
        routes_["POST /api/mpc/sign/start"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"signSessionId\":\"sign_session_" << std::time(nullptr) 
                 << "\",\"status\":\"started\",\"transactionData\":\"0xabc123...\","
                 << "\"participantsRequired\":2,\"round\":1}";
            return createSuccessResponse(data.str(), "MPC 签名启动成功");
        };

        // 获取会话状态
        routes_["GET /api/mpc/session/status"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"sessionId\":\"session_123\",\"type\":\"keygen\",\"status\":\"active\","
                 << "\"participants\":[\"participant_1\",\"participant_2\"],\"round\":2,"
                 << "\"progress\":75}";
            return createSuccessResponse(data.str());
        };

        // 获取活跃会话
        routes_["GET /api/mpc/sessions"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "[{\"sessionId\":\"session_1\",\"type\":\"keygen\",\"status\":\"active\","
                 << "\"participants\":2,\"round\":1},{\"sessionId\":\"session_2\","
                 << "\"type\":\"sign\",\"status\":\"completed\",\"participants\":2,\"round\":3}]";
            return createSuccessResponse(data.str());
        };

        // 提交参与方数据
        routes_["POST /api/mpc/session/data"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"sessionId\":\"session_123\",\"participantId\":\"participant_1\","
                 << "\"round\":2,\"status\":\"data_received\"}";
            return createSuccessResponse(data.str(), "交互数据提交成功");
        };
    }

    void setupBlockchainRoutes() {
        // 获取网络信息
        routes_["GET /api/blockchain/network-info"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"chainId\":1,\"networkName\":\"mainnet\",\"blockNumber\":" 
                 << (18000000 + (std::time(nullptr) % 1000)) << ",\"gasPrice\":\"20000000000\","
                 << "\"isConnected\":true}";
            return createSuccessResponse(data.str());
        };

        // 获取最新区块
        routes_["GET /api/blockchain/latest-block"] = [this](const std::string& body) -> std::string {
            auto blockNumber = 18000000 + (std::time(nullptr) % 1000);
            std::ostringstream data;
            data << "{\"blockNumber\":" << blockNumber << ",\"blockHash\":\"0x" 
                 << std::hex << std::time(nullptr) << "abc123...\",\"timestamp\":" 
                 << std::time(nullptr) << ",\"transactions\":" << (std::time(nullptr) % 100) 
                 << ",\"gasUsed\":\"8000000\",\"gasLimit\":\"15000000\"}";
            return createSuccessResponse(data.str());
        };

        // 获取账户余额
        routes_["GET /api/blockchain/balance"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"address\":\"0x123abc456def...\",\"balance\":\"1234567890123456789\","
                 << "\"balanceEth\":\"1.234568 ETH\",\"nonce\":42}";
            return createSuccessResponse(data.str());
        };

        // 获取Nonce
        routes_["GET /api/blockchain/nonce"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"address\":\"0x123abc456def...\",\"nonce\":" 
                 << (std::time(nullptr) % 1000) << "}";
            return createSuccessResponse(data.str());
        };

        // 验证地址格式
        routes_["POST /api/blockchain/validate-address"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"address\":\"0x123abc456def...\",\"isValid\":true,\"type\":\"EOA\"}";
            return createSuccessResponse(data.str());
        };

        // 获取代币余额
        routes_["GET /api/blockchain/token-balance"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"address\":\"0x123...\",\"tokenAddress\":\"0x456...\","
                 << "\"balance\":\"1000000000000000000\",\"decimals\":18,\"symbol\":\"USDC\"}";
            return createSuccessResponse(data.str());
        };

        // 获取代币信息
        routes_["GET /api/blockchain/token-info"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"tokenAddress\":\"0x456...\",\"name\":\"USD Coin\","
                 << "\"symbol\":\"USDC\",\"decimals\":18,\"totalSupply\":\"1000000000000000000000\"}";
            return createSuccessResponse(data.str());
        };

        // 搜索
        routes_["GET /api/blockchain/search"] = [this](const std::string& body) -> std::string {
            std::ostringstream data;
            data << "{\"query\":\"0x123...\",\"type\":\"address\",\"found\":true,"
                 << "\"result\":{\"address\":\"0x123...\",\"type\":\"EOA\",\"balance\":\"1.234 ETH\"}}";
            return createSuccessResponse(data.str());
        };
    }

    std::string processRequest(const std::string& method, const std::string& path, const std::string& body) {
        std::string route_key = method + " " + path;
        
        auto it = routes_.find(route_key);
        if (it != routes_.end()) {
            try {
                return it->second(body);
            } catch (const std::exception& e) {
                return createErrorResponse(e.what(), 500);
            }
        }
        
        return createErrorResponse("接口不存在", 404);
    }

public:
    MPCWalletServer(int port) : port_(port) {
        setupRoutes();
    }

    void start() {
        std::cout << "🚀 MPC钱包C++服务器运行在端口 " << port_ << std::endl;
        std::cout << "📝 健康检查: http://localhost:" << port_ << "/health" << std::endl;
        std::cout << "🌐 API 端点: http://localhost:" << port_ << "/api" << std::endl;
        std::cout << "💡 这是一个C++实现的模拟服务器，与Node.js版本具有相同的API接口" << std::endl;
        std::cout << "✨ 按 Ctrl+C 停止服务器" << std::endl;
        
        printApiEndpoints();
        
        // 交互式演示
        std::string input;
        while (true) {
            std::cout << "\n输入 'test <method> <path>' 来测试API，'list' 查看所有接口，或 'quit' 退出: ";
            std::getline(std::cin, input);
            
            if (input == "quit" || input == "exit") {
                std::cout << "👋 服务器已停止" << std::endl;
                break;
            }
            
            if (input == "list") {
                printApiEndpoints();
                continue;
            }
            
            if (input.substr(0, 4) == "test") {
                std::istringstream iss(input);
                std::string cmd, method, path;
                iss >> cmd >> method >> path;
                
                if (!method.empty() && !path.empty()) {
                    std::string response = processRequest(method, path, "{}");
                    std::cout << "📦 响应: " << response << std::endl;
                } else {
                    std::cout << "❌ 用法: test <method> <path>" << std::endl;
                    std::cout << "   例如: test GET /health" << std::endl;
                    std::cout << "   例如: test POST /api/wallet/create" << std::endl;
                }
            } else if (!input.empty()) {
                std::cout << "❓ 未知命令。输入 'list' 查看可用命令。" << std::endl;
            }
        }
    }

private:
    void printApiEndpoints() {
        std::cout << "\n📊 支持的API接口 (与Node.js版本相同):" << std::endl;
        std::cout << "┌─────────────────────────────────────────────────────────────┐" << std::endl;
        std::cout << "│ 💊 健康检查                                                  │" << std::endl;
        std::cout << "│   GET  /health - 健康检查                                   │" << std::endl;
        std::cout << "│   GET  / - 服务信息                                         │" << std::endl;
        std::cout << "├─────────────────────────────────────────────────────────────┤" << std::endl;
        std::cout << "│ 💰 钱包管理                                                  │" << std::endl;
        std::cout << "│   POST /api/wallet/create - 创建钱包                        │" << std::endl;
        std::cout << "│   POST /api/wallet/import - 导入钱包                        │" << std::endl;
        std::cout << "│   GET  /api/wallet/list - 获取钱包列表                      │" << std::endl;
        std::cout << "│   GET  /api/wallet/balance - 获取余额                       │" << std::endl;
        std::cout << "│   DELETE /api/wallet/delete - 删除钱包                      │" << std::endl;
        std::cout << "├─────────────────────────────────────────────────────────────┤" << std::endl;
        std::cout << "│ 💸 交易管理                                                  │" << std::endl;
        std::cout << "│   POST /api/transaction/create - 创建交易                   │" << std::endl;
        std::cout << "│   POST /api/transaction/estimate-gas - 估算Gas              │" << std::endl;
        std::cout << "│   GET  /api/transaction/gas-price - 获取Gas价格             │" << std::endl;
        std::cout << "│   POST /api/transaction/broadcast - 广播交易                │" << std::endl;
        std::cout << "│   GET  /api/transaction/status - 获取交易状态               │" << std::endl;
        std::cout << "│   GET  /api/transaction/history - 获取交易历史              │" << std::endl;
        std::cout << "├─────────────────────────────────────────────────────────────┤" << std::endl;
        std::cout << "│ 🔐 MPC多方计算                                               │" << std::endl;
        std::cout << "│   POST /api/mpc/keygen/start - 启动MPC密钥生成              │" << std::endl;
        std::cout << "│   POST /api/mpc/keygen/join - 加入MPC密钥生成               │" << std::endl;
        std::cout << "│   POST /api/mpc/sign/start - 启动MPC签名                    │" << std::endl;
        std::cout << "│   GET  /api/mpc/session/status - 获取会话状态               │" << std::endl;
        std::cout << "│   GET  /api/mpc/sessions - 获取活跃会话                     │" << std::endl;
        std::cout << "│   POST /api/mpc/session/data - 提交参与方数据               │" << std::endl;
        std::cout << "├─────────────────────────────────────────────────────────────┤" << std::endl;
        std::cout << "│ ⛓️  区块链交互                                                │" << std::endl;
        std::cout << "│   GET  /api/blockchain/network-info - 获取网络信息          │" << std::endl;
        std::cout << "│   GET  /api/blockchain/latest-block - 获取最新区块          │" << std::endl;
        std::cout << "│   GET  /api/blockchain/balance - 获取账户余额               │" << std::endl;
        std::cout << "│   GET  /api/blockchain/nonce - 获取账户Nonce                │" << std::endl;
        std::cout << "│   POST /api/blockchain/validate-address - 验证地址          │" << std::endl;
        std::cout << "│   GET  /api/blockchain/token-balance - 获取代币余额         │" << std::endl;
        std::cout << "│   GET  /api/blockchain/token-info - 获取代币信息            │" << std::endl;
        std::cout << "│   GET  /api/blockchain/search - 搜索区块链数据              │" << std::endl;
        std::cout << "└─────────────────────────────────────────────────────────────┘" << std::endl;
    }
};

int main() {
    try {
        const char* port_env = std::getenv("PORT");
        int port = port_env ? std::atoi(port_env) : 8080;
        
        std::cout << "🎯 MPC钱包C++服务器 v1.0.0" << std::endl;
        std::cout << "📄 与Node.js版本具有相同的API接口" << std::endl;
        
        MPCWalletServer server(port);
        server.start();
        
    } catch (const std::exception& e) {
        std::cerr << "❌ 服务器启动失败: " << e.what() << std::endl;
        return 1;
    }

    return 0;
} 