#include "../include/common.h"
#include <iostream>
#include <sstream>
#include <map>
#include <ctime>
#include <iomanip>

class SimpleHttpServer {
private:
    int port_;
    std::map<std::string, std::function<void(const std::string&, std::string&)>> routes_;

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
        routes_["GET /health"] = [this](const std::string& body, std::string& response) {
            auto now = std::time(nullptr);
            std::ostringstream data;
            data << "{\"status\":\"ok\",\"timestamp\":\"" << now 
                 << "\",\"version\":\"1.0.0\"}";
            response = createSuccessResponse(data.str());
        };

        // 根路径信息
        routes_["GET /"] = [this](const std::string& body, std::string& response) {
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
            response = createSuccessResponse(data.str());
        };

        // 钱包相关接口
        setupWalletRoutes();
        
        // 交易相关接口
        setupTransactionRoutes();
        
        // MPC相关接口  
        setupMpcRoutes();
        
        // 区块链相关接口
        setupBlockchainRoutes();
    }

    void setupWalletRoutes() {
        // 创建钱包
        routes_["POST /api/wallet/create"] = [this](const std::string& body, std::string& response) {
            std::ostringstream data;
            data << "{\"walletId\":\"wallet_" << std::time(nullptr) 
                 << "\",\"participantCount\":2,\"threshold\":2}";
            response = createSuccessResponse(data.str(), "钱包创建成功");
        };

        // 导入钱包
        routes_["POST /api/wallet/import"] = [this](const std::string& body, std::string& response) {
            std::ostringstream data;
            data << "{\"walletId\":\"imported_wallet_" << std::time(nullptr) << "\"}";
            response = createSuccessResponse(data.str(), "钱包导入成功");
        };

        // 获取钱包余额
        routes_["GET /api/wallet/balance"] = [this](const std::string& body, std::string& response) {
            std::ostringstream data;
            data << "{\"balance\":\"1.234567\",\"formatted\":\"1.2346 ETH\"}";
            response = createSuccessResponse(data.str());
        };
    }

    void setupTransactionRoutes() {
        // 创建交易
        routes_["POST /api/transaction/create"] = [this](const std::string& body, std::string& response) {
            std::ostringstream data;
            data << "{\"transactionId\":\"tx_" << std::time(nullptr) 
                 << "\",\"status\":\"created\"}";
            response = createSuccessResponse(data.str(), "交易创建成功");
        };

        // 估算Gas费用
        routes_["POST /api/transaction/estimate-gas"] = [this](const std::string& body, std::string& response) {
            std::ostringstream data;
            data << "{\"gasLimit\":21000,\"gasPrice\":\"20000000000\"}";
            response = createSuccessResponse(data.str());
        };

        // 获取Gas价格
        routes_["GET /api/transaction/gas-price"] = [this](const std::string& body, std::string& response) {
            std::ostringstream data;
            data << "{\"gasPrice\":\"20000000000\",\"gasPriceGwei\":\"20.0 Gwei\"}";
            response = createSuccessResponse(data.str());
        };

        // 广播交易
        routes_["POST /api/transaction/broadcast"] = [this](const std::string& body, std::string& response) {
            std::ostringstream data;
            data << "{\"transactionHash\":\"0xabc123def456...\"}";
            response = createSuccessResponse(data.str(), "交易广播成功");
        };
    }

    void setupMpcRoutes() {
        // 启动MPC密钥生成
        routes_["POST /api/mpc/keygen/start"] = [this](const std::string& body, std::string& response) {
            std::ostringstream data;
            data << "{\"sessionId\":\"mpc_session_" << std::time(nullptr) 
                 << "\",\"status\":\"started\"}";
            response = createSuccessResponse(data.str(), "MPC 密钥生成启动成功");
        };

        // 加入MPC密钥生成
        routes_["POST /api/mpc/keygen/join"] = [this](const std::string& body, std::string& response) {
            std::ostringstream data;
            data << "{\"sessionId\":\"mpc_session_123\",\"participantId\":\"participant_1\"}";
            response = createSuccessResponse(data.str(), "MPC 密钥生成加入成功");
        };

        // 启动MPC签名
        routes_["POST /api/mpc/sign/start"] = [this](const std::string& body, std::string& response) {
            std::ostringstream data;
            data << "{\"signSessionId\":\"sign_session_" << std::time(nullptr) 
                 << "\",\"status\":\"started\"}";
            response = createSuccessResponse(data.str(), "MPC 签名启动成功");
        };

        // 获取活跃会话
        routes_["GET /api/mpc/sessions"] = [this](const std::string& body, std::string& response) {
            std::ostringstream data;
            data << "[{\"sessionId\":\"session_1\",\"type\":\"keygen\",\"status\":\"active\"}]";
            response = createSuccessResponse(data.str());
        };
    }

    void setupBlockchainRoutes() {
        // 获取网络信息
        routes_["GET /api/blockchain/network-info"] = [this](const std::string& body, std::string& response) {
            std::ostringstream data;
            data << "{\"chainId\":1,\"networkName\":\"mainnet\",\"blockNumber\":18000000}";
            response = createSuccessResponse(data.str());
        };

        // 获取最新区块
        routes_["GET /api/blockchain/latest-block"] = [this](const std::string& body, std::string& response) {
            std::ostringstream data;
            data << "{\"blockNumber\":18000000,\"blockHash\":\"0xabc123...\",\"timestamp\":" 
                 << std::time(nullptr) << "}";
            response = createSuccessResponse(data.str());
        };

        // 获取账户余额
        routes_["GET /api/blockchain/balance"] = [this](const std::string& body, std::string& response) {
            std::ostringstream data;
            data << "{\"address\":\"0x123...\",\"balance\":\"1000000000000000000\",\"balanceEth\":\"1.000000 ETH\"}";
            response = createSuccessResponse(data.str());
        };

        // 验证地址格式
        routes_["POST /api/blockchain/validate-address"] = [this](const std::string& body, std::string& response) {
            std::ostringstream data;
            data << "{\"address\":\"0x123...\",\"isValid\":true}";
            response = createSuccessResponse(data.str());
        };
    }

    std::string processRequest(const std::string& method, const std::string& path, const std::string& body) {
        std::string route_key = method + " " + path;
        
        auto it = routes_.find(route_key);
        if (it != routes_.end()) {
            std::string response;
            try {
                it->second(body, response);
                return response;
            } catch (const std::exception& e) {
                return createErrorResponse(e.what(), 500);
            }
        }
        
        return createErrorResponse("接口不存在", 404);
    }

public:
    SimpleHttpServer(int port) : port_(port) {
        setupRoutes();
    }

    void start() {
        std::cout << "🚀 MPC钱包C++服务器运行在端口 " << port_ << std::endl;
        std::cout << "📝 健康检查: http://localhost:" << port_ << "/health" << std::endl;
        std::cout << "🌐 API 端点: http://localhost:" << port_ << "/api" << std::endl;
        std::cout << "💡 这是一个简化的模拟服务器，用于演示API接口" << std::endl;
        std::cout << "✨ 按 Ctrl+C 停止服务器" << std::endl;
        
        // 模拟服务器运行
        std::cout << "\n📊 支持的API接口:" << std::endl;
        std::cout << "GET  /health - 健康检查" << std::endl;
        std::cout << "GET  / - 服务信息" << std::endl;
        std::cout << "POST /api/wallet/create - 创建钱包" << std::endl;
        std::cout << "POST /api/wallet/import - 导入钱包" << std::endl;
        std::cout << "GET  /api/wallet/balance - 获取余额" << std::endl;
        std::cout << "POST /api/transaction/create - 创建交易" << std::endl;
        std::cout << "POST /api/transaction/estimate-gas - 估算Gas" << std::endl;
        std::cout << "GET  /api/transaction/gas-price - 获取Gas价格" << std::endl;
        std::cout << "POST /api/transaction/broadcast - 广播交易" << std::endl;
        std::cout << "POST /api/mpc/keygen/start - 启动MPC密钥生成" << std::endl;
        std::cout << "POST /api/mpc/keygen/join - 加入MPC密钥生成" << std::endl;
        std::cout << "POST /api/mpc/sign/start - 启动MPC签名" << std::endl;
        std::cout << "GET  /api/mpc/sessions - 获取活跃会话" << std::endl;
        std::cout << "GET  /api/blockchain/network-info - 获取网络信息" << std::endl;
        std::cout << "GET  /api/blockchain/latest-block - 获取最新区块" << std::endl;
        std::cout << "GET  /api/blockchain/balance - 获取账户余额" << std::endl;
        std::cout << "POST /api/blockchain/validate-address - 验证地址" << std::endl;
        
        // 简单的交互式演示
        std::string input;
        while (true) {
            std::cout << "\n输入 'test <method> <path>' 来测试API，或输入 'quit' 退出: ";
            std::getline(std::cin, input);
            
            if (input == "quit") {
                break;
            }
            
            if (input.substr(0, 4) == "test") {
                std::istringstream iss(input);
                std::string cmd, method, path;
                iss >> cmd >> method >> path;
                
                if (!method.empty() && !path.empty()) {
                    std::string response = processRequest(method, path, "{}");
                    std::cout << "响应: " << response << std::endl;
                } else {
                    std::cout << "用法: test <method> <path>" << std::endl;
                    std::cout << "例如: test GET /health" << std::endl;
                }
            }
        }
    }
};

int main() {
    try {
        const char* port_env = std::getenv("PORT");
        int port = port_env ? std::atoi(port_env) : 8080;
        
        SimpleHttpServer server(port);
        server.start();
        
    } catch (const std::exception& e) {
        std::cerr << "服务器启动失败: " << e.what() << std::endl;
        return 1;
    }

    return 0;
} 