# answer_generator.py
from asyncio import Lock
import asyncio
from collections import defaultdict
import decimal
import logging
import os
import psutil
import re
from typing import AsyncIterator, List, Dict, Optional, Tuple, Union
import pyodbc
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain_core.runnables import RunnableSequence
from .URLHandler import URLHandler
from redis import asyncio as aioredis
from .config import (
    GOOGLE_API_KEY_LLM,
    GOOGLE_API_KEY_SQL,
    GOOGLE_API_KEY_QUERY,
    NETCORE_API_URL,
    FE_API_URL,
)
from .data_loader import DataLoader
import time as time_module
import json
import uuid
import emoji
from datetime import datetime, date, time, timedelta

# from vector_store import VectorStore
from .Promft import TablePromptGenerator

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class AnswerGenerator:

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY_LLM,
            temperature=0.5,
            max_output_tokens=2024,
            disable_streaming=False,
        )
        self.sql_llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY_SQL,
            temperature=0,
            max_output_tokens=2024,
            disable_streaming=True,
        )
        self.sql_query = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY_QUERY,
            temperature=0.3,
            max_output_tokens=2024,
            disable_streaming=True,
        )
        # self.vectorstore = vectorstore
        self.data_loader = DataLoader()
        self.url_handler = URLHandler(self.data_loader)
        self.normalized_query = ""
        self.intent = ""
        self.table_name = ""
        self.last_data_time = None
        # self.chain = self._create_chain()
        self.sql_cache_locks = defaultdict(Lock)
        self.table_prompt_generator = TablePromptGenerator()
        self.redis = aioredis.from_url(
            f"rediss://{os.getenv('REDIS_HOST')}",
            password=os.getenv("REDIS_PASSWORD"),
            decode_responses=False,
        )
        # self.redis = aioredis.from_url("redis://localhost", decode_responses=False)
        self.mappings = {
            "Posts": "/post/{id}",
            "RidePosts": "/sharing-ride",
            "Users": "/profile/{id}",
            "Rides": "/your-ride",
            "Notifications": "/notify",
            "Reports": "/home",
            "RideReports": "/home",
            "Friendships": {
                "UserId": "/profile/{id}",
                "FriendId": "/profile/{id}",
            },
        }
        self.base_url = FE_API_URL

    async def _preprocess_query_async(
        self, query: str, chat_history: List[Dict]
    ) -> Dict:
        logger.debug(f"Preprocessing query: {query}")

        preprocess_prompt = PromptTemplate(
            input_variables=["query", "chat_history"],
            template="""
            You are a Vietnamese query preprocessor for a database-driven ride-sharing application. Your task is to process the current query based on the chat history to identify relevant entities, IDs, and database tables.   
            ### Current Query:
            {query}
            
            ### Chat History:
            {chat_history}
            **The chat_history contains key fields to pay attention to:
            answer: Your previous response to the user.
            context: The chat history or context preceding the current interaction.
            type: The type of user action in the previous step.
            Important Note:
            Pay close attention to {{type}} — if it includes "CREATE", "UPDATE", or "DELETE", you must carefully interpret the meaning of {{answer}}.
            If it contains "Executing action" (or similar), check what the user is currently doing (typically a "SELECT" operation).**


            ---
            You MUST always analyze the full conversation history above (`chat_history`) to extract any ID values mentioned or implied (e.g., post ID, ride ID, user ID, conversation ID, etc.).
            🧠 **YOU MUST ALWAYS DO THIS FIRST**:
            Analyze the `chat_history`, including previous user queries (`Query`) and assistant responses (`Answer`). Identify any **data-related actions** implied, including:

            - Which **type** of operation it is (`CREATE`, `UPDATE`, or `DELETE`)
            - Which **table(s)** are involved (`Users`, `Posts`, `Comments`, `CommentLikes`, etc.)
            - Any **ID(s)** mentioned or implied (e.g. post ID, comment ID, user ID...)
            ### 🔍 Classification Rules:
            - **CREATE**:
            - User wants to **add** or **generate** new information.
            - Examples: "Tôi muốn đăng bài", "Tôi muốn like", "Tôi muốn comment", "Tôi muốn tham gia chuyến đi", "Trả lời comment","Ghép chuyến đi","Chấp nhận chuyến đi", "Thêm bạn", v.v.
            - ➤ Return: `type = CREATE`, with related table(s).

            - **UPDATE**:
            - User wants to **change**, **edit**, or **modify** existing information.
            - Examples: "Sửa nội dung bài đăng", "Cập nhật lại bài post", "Thay đổi tên tôi", "Chỉnh sửa bình luận", v.v.
            - ➤ Return: `type = UPDATE`, with related table(s).

            - **DELETE**:
            - User wants to **remove** or **undo** an existing item.
            - Examples: "Xóa bài viết", "Xóa comment", "Hủy chuyến đi", "Bỏ like", "Hủy kết bạn", v.v.
            - ➤ Return: `type = DELETE`, with related table(s).
            - **SEARCH**:
            - User wants to **retrieve** or **look up** information without modifying it.
            - Examples: "Tìm kiếm bài viết", "Xem danh sách bạn bè", "Lấy thông tin chuyến đi", "Xem thông báo", "Tìm kiếm chuyến đi", "Thông tin của tôi", "Tìm kiếm chuyến đi", "Tìm kiếm bài đăng", "Tìm kiếm bình luận", "Tìm kiếm người dùng","Tìm kiếm Bài đăng", "Xem thông tin chuyến đi", "Xem thông tin người dùng", "Tìm kiếm thông báo", "Tìm kiếm báo cáo", "Tìm kiếm bạn bè", "Tìm kiếm bình luận", "Tìm kiếm chuyến đi đã tham gia", "Tìm kiếm chuyến đi đã lái xe", v.v. 
            - ➤ Return: `type = SEARCH`, with relevant table(s) if applicable.
            - **FALSE**:
            - User asks a question unrelated to the database or system.
            - Examples: "Hôm nay là ngày gì?", "Thời tiết hôm nay như thế nào?", "Tôi muốn biết về hệ thống này", "Có quán ăn nào gần đây không?", "Có siêu thị nào gần đây không?", "Làm sao tôi có thể tham gia chuyến đi?", "Làm sao tôi có thể đăng bài?", "Làm sao tôi có thể tìm kiếm chuyến đi?", "Làm sao tôi có thể tìm kiếm bài đăng?", "Làm sao tôi có thể tìm kiếm bình luận?", "Làm sao tôi có thể tìm kiếm người dùng?", "Làm sao tôi có thể tìm kiếm thông báo?", "Làm sao tôi có thể tìm kiếm báo cáo?", "Làm sao tôi có thể tìm kiếm bạn bè?", "Làm sao tôi có thể tìm kiếm bình luận?", "Làm sao tôi có thể tìm kiếm chuyến đi đã tham gia?", "Làm sao tôi có thể tìm kiếm chuyến đi đã lái xe?", "Hệ thống vận hành như thế nào?", "Hướng dẫn sử dụng hệ thống", "Cách đăng ký tài khoản", "Cách đăng nhập vào hệ thống", "Cách thay đổi mật khẩu", "Cách cập nhật thông tin cá nhân", "Cách tìm kiếm chuyến đi", "Cách tìm kiếm bài đăng", "Cách tìm kiếm bình luận", "Cách tìm kiếm người dùng", "Cách tìm kiếm thông báo", "Cách tìm kiếm báo cáo", "Cách tìm kiếm bạn bè", "Cách tìm kiếm bình luận", "Cách tìm kiếm chuyến đi đã tham gia", "Cách tìm kiếm chuyến đi đã lái xe",vv.
            **DIFF**:
            **Extremely Important Note: You must distinguish and consider whether the user's question is attempting to extract sensitive information from the system.**
            - If the user asks questions about queries to the Database, the information that the user is not authorized to access, you must return `type` as `DIFF` and `relevant_tables` as `null`.
            - Examples: "Tôi muốn xem thông tin cơ sở dữ liệu", "Tôi muốn xem cấu trúc bảng trong cơ sở dữ liệu", "Tôi muốn xem các bảng trong cơ sở dữ liệu", "Tôi muốn xem các cột trong bảng Users", "Tôi muốn xem các cột trong bảng RidePosts", "Tôi muốn xem các cột trong bảng Rides", "Tôi muốn xem các cột trong bảng Posts", "Tôi muốn xem các cột trong bảng Comments", "Tôi muốn xem các cột trong bảng CommentLikes", "Tôi muốn xem các cột trong bảng Friendships", "Tôi muốn xem các cột trong bảng Messages", "Tôi muốn xem các cột trong bảng Conversations", "Tôi muốn xem các cột trong bảng Notifications", "Tôi muốn xem các cột trong bảng Reports", "Tôi muốn xem các cột trong bảng Ratings".
            - Examples: "Tôi muốn xem tất cả dữ liệu trong bảng Users", "Tôi muốn xem tất cả dữ liệu trong bảng RidePosts", "Tôi muốn xem tất cả dữ liệu trong bảng Rides", "Tôi muốn xem tất cả dữ liệu trong bảng Posts", "Tôi muốn xem tất cả dữ liệu trong bảng Comments", "Tôi muốn xem tất cả dữ liệu trong bảng CommentLikes", "Tôi muốn xem tất cả dữ liệu trong bảng Friendships", "Tôi muốn xem tất cả dữ liệu trong bảng Messages", "Tôi muốn xem tất cả dữ liệu trong bảng Conversations", "Tôi muốn xem tất cả dữ liệu trong bảng Notifications", "Tôi muốn xem tất cả dữ liệu trong bảng Reports", "Tôi muốn xem tất cả dữ liệu trong bảng Ratings".
            ---

            🛑 **IMPORTANT: If user intent involves CREATE, UPDATE, or DELETE**, you MUST return:
            - `type`: One of `CREATE`, `UPDATE`, or `DELETE`
            - `tables`: A list of affected table names like `[Users, Posts]`
            **THE MOST IMPORTANT**:If the user's question is related to CREATE, DELETE, or UPDATE operations—or even implies any action related to creating, deleting, or updating data—you MUST IMMEDIATELY return type as one of the three words: "CREATE", "DELETE", or "UPDATE" and related tables(Users,Posts,Comments and CommentLikes) analyzing any further details!
            **NOTE**: In the {{query}}, sometimes there will be words like update, delete but the intention is not necessarily Add Delete Edit, it can still be a question related to SELECT to look up information.
            **Example**
            -Query:"Giới tính của tôi đã được cập nhật chưa" -> ý đinh là 1 câu hỏi -> SELECT
            -Query:"Bài post mới nhất của tôi đã bị xóa khi nào" -> ý đinh là câu hỏi -> SELECT
            ---
            If the current query is referring to or continuing from a previous discussion in the chat history, and any specific IDs can be inferred (such as a ride, post, comment, message, conversation, user, friend, report, etc.), then:
            - You MUST extract those IDs and place them in the `"ids"` field of the output JSON.
            Perform the following tasks:
            **Decription my project**
            The website is designed to create a communication and information-sharing platform among university students—a social network specifically for students. This platform can serve multiple purposes, such as:
            Sharing transportation information: Students can post travel announcements from point A to point B to find carpool partners, helping save costs and strengthen connections.
            Sharing study materials: Students who have leftover study materials after completing a course can sell or share them with others in need.
            Posting, commenting, liking, and sharing: Similar to how Facebook works.
            Messaging and chatting: Enables students to communicate with each other just like on Facebook.

            Other services: The platform can be extended to include item exchange, study group organization, and discussions on academic topics or student life.
            1. **Spelling Correction**:
            - Correct only Vietnamese spelling mistakes in the input query.
            - Do not rephrase, add, or remove words unless they are misspelled.
            - Preserve names, locations, abbreviations, and slang if correctly spelled.
            - Maintain the original structure and intent of the question.

            2. **Entity and ID Identification**:
            - **Always** check the `context` field in the chat history for relevant IDs (e.g., RidePostId, DriverId, UserId).
            - Use the `meaning` field in `context` to determine the type of each ID (e.g., `Id: RidePostId`, `UserId: DriverId`).
            - Extract all relevant IDs based on the query and chat history. For example:
            - If the query refers to "tài xế này" and the chat history contains a `DriverId` in `context.meaning`, include `{{"id": "<DriverId>", "type": "DriverId"}}` in the `ids` output.
            - If the query refers to a ride and the chat history contains a `RidePostId`, include `{{"id": "<RidePostId>", "type": "RidePostId"}}`.
            - Return an empty `ids` list (`[]`) only if no relevant IDs are found in the chat history or if the query is unrelated to any IDs.
            - **Ensure** the `ids` field is always included in the output, even if empty.

            3. **Table Identification**:
            - Identify database tables directly related to the query and chat history.
            - Use `context.meaning` and query content to select tables (e.g., `Ratings` for reputation queries).
            - Return an empty list `[]` if the query is unrelated to the schema.
            4. **Answer History is related to an error**:
            - You can skip the answer history if it is related to an error or a system message.
            **Database Table Semantics & Relationships**:
            * **Users**: Stores basic user information. Primary Key: `Id`.
            * **RidePosts**: Represents **offers** or requests for shared rides. Primary Key: `Id`. Foreign Key: `UserId` references `Users.Id`. Contains `StartLocation`, `EndLocation`, `StartTime`, `Content`, `Status` (Integer: 0: open, 1: Matched, 2: Canceled). **Use this table when users search for available rides or view ride offers they created.**
            * **Rides**: Represents **actual accepted/joined** rides. Primary Key: `Id`. Foreign Keys: `PassengerId` references `Users.Id`, `DriverId` references `Users.Id` (DriverId should be the same as RidePosts.UserId), `RidePostId` references `RidePosts.Id`. Contains `StartTime`, `EndTime`, `Status` (Integer: 0: Pending, 1: Accepted, 2: Rejected, 3: Completed), `Fare`, `CreatedAt` (when passenger accepted), `IsSafetyTrackingEnabled` (boolean: 1 for enabled, 0 for disabled). **Only query this table when the user asks about rides they have specifically joined as a passenger or driven for.**
            * **Shares**: Tracks when users share posts. Primary Key: `Id`. Foreign Keys: `UserId` references `Users.Id`, `PostId` references `Posts.Id`.
            * **Posts**: Stores user-created posts (like Facebook status updates). Primary Key: `Id`. Foreign Key: `UserId` references `Users.Id`. Contains `Content`, `ImageUrl`, `VideoUrl`, `CreatedAt`.
            * **Likes**: Tracks likes on posts. Primary Key: `Id`. Foreign Keys: `UserId` references `Users.Id`, `PostId` references `Posts.Id`. `IsLike` is boolean (true: 1, false: 0, potentially for unlike).
            * **Comments**: Stores comments on posts. Primary Key: `Id`. Foreign Keys: `UserId` references `Users.Id`, `PostId` references `Posts.Id`. Contains `Content`.
            * **CommentLikes**: Tracks likes on comments. Primary Key: `Id`. Foreign Keys: `UserId` references `Users.Id`, `CommentId` references `Comments.Id`.
            * **Friendships**: Manages friend relationships. Primary Key: `Id`. Foreign Keys: `UserId` references `Users.Id`, `FriendId` references `Users.Id`. `Status` (Integer: 0: Pending, 1: Accepted, 2: Rejected, 3: Removed). Represents a two-way relationship when Status is 1.
            * **Messages**: Stores individual messages within a conversation. Primary Key: `Id`. Foreign Keys: `ConversationId` references `Conversations.Id`, `SenderId` references `Users.Id`. Contains `Content` and `Status` (Integer: 0: Sent, 1: Delivered, 2: Seen). *(Note: You referred to this table as 'Messengers' but 'Messages' is more standard and aligns with the template's original intent)*.
            * **Conversations**: Represents a chat conversation between two users. Primary Key: `Id`. Foreign Keys: `UserId1` references `Users.Id`, `User2Id` references `Users.Id`. **Crucially, only queryable if the current `user_id` matches either `UserId1` or `UserId2`**.
            * **Notifications**: Stores notifications sent to users. Primary Key: `Id`. Foreign Keys: `SenderId` references `Users.Id`, `ReceiverId` references `Users.Id`. Contains `Title`, `Content`, `IsRead` (boolean: 1 for read, 0 for unread), `Url` endpoint, and `Type` (Integer: 0: PostLiked, 1: PostCommented, 2: PostShared, 3: NewMessage, 4: NewFriendRequest, 5: RideInvite, 6: SystemAlert, 7: SendFriend, 8: AcceptFriend, 9: RejectFriend).
            * **Reports**: Stores user-submitted reports (e.g., on posts). Primary Key: `Id`. Foreign Keys: `ReportedBy` references `Users.Id`, `PostId` references `Posts.Id`. *(Assuming reports are primarily on posts based on FK)*.
            * **Ratings**: This table tracks ratings after a ride. Each rating is submitted by a user (RatedByUserId) and targets another user (UserId), typically a driver. Ratings also reference the ride (`RideId`) and include a numeric level and optional comment.

            **Output Format**:
            1. `normalized_query` : standardized questions.
            2. `relevant_tables`:The tables are believed to relate most accurately.
            3. `ids`:All Ids in the relevant chat history
            - Khi người dùng đề cập đến "chuyến thứ X" (ví dụ: "chuyến thứ 3"), bạn PHẢI xác định đúng ID của chuyến đi tương ứng từ `context` trong `chat_history`.
            - Kiểm tra trường `Id` trong `context` (thường là UUID, không phải URL như `http://localhost:3000/sharing-ride`).
            - Nếu không tìm thấy ID rõ ràng, trả về `ids` rỗng (`[]`) và ghi chú trong `alert` rằng cần thêm thông tin.
            3.  `type`: SEARCH (if the question is related to the data or the system's tables).
                - type will be false if the user asks questions that are not related to the system, and in that case, `relevant_tables` will be null.
                ** If the {{query}} question is related to the tutorial system, the type will also be FALSE:
                **example:** Where to update profile, where to post about cars, where to change password, increase reputation points, how to make friends,...etc...
                *Example Query*
                Example (User asks: "Giải thích cho tôi về các bảng trong cơ sở dữ liệu này")
                Example (User asks: "Tôi muốn biết về các bảng trong cơ sở dữ liệu này")
                Example (User asks: "Có quán ăn nào trên chuyến đi từ Quang Trung đến Nguyễn Văn Linh không?")
                Example (User asks: "Thời tiết hôm nay như thế nào")
                `Type` FALSE if the question is not related to the data or the system's tables, and in that case, `relevant_tables` will be null.
                **Example Query**
                Example (User asks: "Giới thiệu về hệ thống này")
                Example (User asks: "Có quán ăn sáng nào ngon trên đoạn đường từ lúc khởi hành đến lúc kết thúc không?")
                Example (User asks: "Bây giờ là mấy giờ?")
                Example (User asks: "Có quán ăn nào gần đây không?")
                Example (User asks: "Có siêu thị nào gần đây không?")
                ...etc.
            4.  `alert`: "You don't have permission to access this data" if the user is not authorized to access the data, otherwise null for `sql` and `params`,`type` equals False.
            Return a JSON object with the following structure:
            {{
            "normalized_query": "<spelling-corrected query in Vietnamese>",
            "relevant_tables": ["<table_name>", ...],
            "ids": [{{"id": "<id_value>", "type": "<id_type>"}}, ...]
            "type":SEARCH or FALSE
            "alert":"some kind of warning"
            }}
            **Quan trọng:** Nếu không xác định được yêu cầu, câu hỏi, hay câu các yêu cầu liên quan đến cập nhật thông tin của người khác, xóa thông tin của người khác, hoặc tạo mới thông tin của người khác, bạn phải trả về `type` là `FALSE`.
            """,
        )

        try:
            # Format chat_history cho prompt
            formatted_history = json.dumps(chat_history, ensure_ascii=False, indent=2)

            # Gọi LLM để xử lý
            chain = preprocess_prompt | self.sql_query
            result = await chain.ainvoke(
                {"query": query, "chat_history": formatted_history}
            )
            logger.debug(f"Kết quả từ LLM: {result.content}")

            # Làm sạch và parse kết quả
            cleaned_content = re.sub(r"```json\n|\n```", "", result.content).strip()
            preprocess_result = json.loads(cleaned_content)

            # Kiểm tra và trả về kết quả
            normalized_query = preprocess_result.get("normalized_query", query)
            relevant_tables = preprocess_result.get("relevant_tables", [])
            ids = preprocess_result.get("ids", [])
            type = preprocess_result.get("type", [])
            alert = preprocess_result.get("alert", [])

            logger.info(f"Câu truy vấn chuẩn hóa: {normalized_query}")
            logger.info(f"Bảng liên quan: {relevant_tables}")
            logger.info(f"IDs tìm thấy: {ids}")

            return {
                "normalized_query": normalized_query,
                "relevant_tables": relevant_tables,
                "ids": ids,
                "type": type,
                "alert": alert,
            }
        except Exception as e:
            logger.error(f"Lỗi khi xử lý truy vấn: {str(e)}", exc_info=True)
            return {"normalized_query": query, "relevant_tables": [], "ids": []}

    async def _generate_sql_query(
        self,
        query: str,
        role: str,
        user_id: str,
        relevant_tables: List[str],
        ids: Optional[List[Dict]] = None,
    ) -> tuple[str, list, Dict]:
        """Generate an SQL query based on the query, intent, role, user_id, relevant tables, and optional context."""
        logger.info(
            f"Generating SQL for query: {query}, Role: {role}, UserId: {user_id}, Relevant Tables: {relevant_tables}, ids: {ids}"
        )

        actual_tables = [
            (
                self.data_loader.table_config[t]["table"]
                if t in self.data_loader.table_config
                else t
            )
            for t in relevant_tables
        ]
        schema = await self.data_loader.get_specific_schemas(actual_tables, "admin")
        if not schema:
            logger.error(
                f"Failed to generate SQL due to missing schema. Query: {query}, Relevant Tables: {relevant_tables}"
            )
            return "", []

        schema_description = "Table structure in UniversitySharingPlatform database:\n"
        for table, columns in schema.items():
            schema_description += f"\nTable {table}:\n"
            for col in columns:
                # Kiểm tra các thông tin bổ sung như bảng và cột tham chiếu
                referenced_info = ""
                if col.get("referenced_table") and col.get("referenced_column"):
                    referenced_info = f" (References {col['referenced_table']}.{col['referenced_column']})"

                # Cập nhật mô tả cột bao gồm tên cột, kiểu dữ liệu, ràng buộc và thông tin tham chiếu nếu có
                schema_description += f"  - {col['column_name']}: {col['data_type']} ({col['constraint']}){referenced_info}\n"
        logger.info(f"Schema description: {schema_description}")
        # Khởi tạo cấu hình bảng
        avalble_columns = []
        for table in relevant_tables:
            table_config = self.data_loader.table_config.get(table, {}) or []
            columns = table_config.get("columns", []) or []
            avalble_columns.append(columns)
            logic_str, semantics_str = (
                self.table_prompt_generator.generate_table_specific_logic(
                    relevant_tables
                )
            )
        logger.info(f"Available columns: {avalble_columns}")
        sql_prompt = PromptTemplate(
            input_variables=[
                "query",
                "schema",
                "user_id",
                "avalble_columns",
                "ids",
                "logic_str",
                "semantics_str",
            ],
            template="""
            You are a useful AI expert in generating SQL statements, specifically designed to generate the most correct, best, and most reasonable queries to the user's question for Gemini 1.5 Flash.
            Always pay attention to the GROUPBY,HAVING,etc sections to avoid causing errors
            Based on the user question: {query}
            Database schema: {schema}
            Current UserId (for filtering 'my' data): {user_id}
            **IDs (optional details)**: {ids}
            **NOTE**:The UserId here refers to the ID of the user currently asking the question. It should only be used when the user's question relates to their own data or actions.
            **NOTE**: Available columns are the columns that are available for the tables in the database. They are used to filter the data that is returned from the database.
            **NOTE**: If the query asks about RidePosts ALLWAYS SELECT RidePosts.UserId, RidePosts.Id, RidePosts.StartLocation, RidePosts.EndLocation, RidePosts.StartTime, RidePosts.Content, RidePosts.Status.
            **Database Table Semantics & Relationships (Numeric Status/Type Codes):**
            **Semantics**: {semantics_str}
            **General SQL Generation Requirements:**
                **NOTE**:ONLY USING SQL SERVER CODE.
                **Use TOP 10** If the query is expected to return a limited number of results or equal "List", "Show me", "Get me", "Retrieve", "Find", "Search", "List", "Display", "Show all", "Get all", "Fetch all" or similar.
            1.  **SELECT Only**: Only generate `SELECT` queries. Do not generate `INSERT`, `UPDATE`, or `DELETE`.
            2.  **Primary and Foreign Keys**:
                * **ALWAYS** include the **Primary Key** (`Id`) of the main table(s) being queried in the `SELECT` list.
                * **ALWAYS** include all **Foreign Key** columns of the main table(s) and related tables involved in `JOIN` clauses, as specified in the schema (e.g., `UserId`, `PostId`, `RidePostId`, `DriverId`, `PassengerId`, `SenderId`, `ReceiverId`, `FriendId`, `UserId1`, `User2Id`, `ReportedBy`, `CommentId`, `ConversationId`, etc.).
                * For each table involved in the query (either in `FROM` or `JOIN`), ensure its **Primary Key** and any **Foreign Keys** (as indicated by `References` in the schema) are included in the `SELECT` list, using appropriate table aliases if needed.
                * Example: For a query on `RidePosts` joined with `Users`, include `RidePosts.Id` (Primary Key), `RidePosts.UserId` (Foreign Key), and `Users.Id` (Primary Key of `Users`).
                ### ALWAYS include the following columns in the `SELECT` list:
                - Users(Id, FullName, ...)
                - Friendships(Id, FriendId, Status, ...)
                - RidePosts(Id, UserId ...)
                - Rides(Id,PassengerId,RidePostId,DriverId,...)
                - Comments(Id, UserId, PostId, ...)
                - Likes(Id, UserId, PostId, ...)
                - Shares(Id, UserId, PostId, ...)
                - Reports(Id, ReportedBy, PostId, ...)
                - Notifications(Id, SenderId, ReceiverId,...)
                - Posts(Id, UserId,...)
                - Rating(Id,UserId,RatedByUserId,RideId,...)
            3.  **User Context (`user_id`)**:
                * For intents explicitly about the current user's data (e.g., `my-posts`, `my-friends`, `my-notifications`, `user-conversations`, `my-rides`) or when the query implies possession ("show me *my* posts", "who are *my* friends"), **ALWAYS** filter based on the current user's ID. Use the `{user_id}` variable provided.
                * Example filter for posts: `WHERE Posts.UserId = ?` (and pass `{user_id}` as the parameter).
                * Example filter for friendships: `WHERE (Friendships.UserId = ? OR Friendships.FriendId = ?) AND Status = 1` (pass `{user_id}` as the parameter twice).
                * Example filter for conversations: `WHERE Conversations.UserId1 = ? OR Conversations.UserId2 = ?` (pass `{user_id}` as the parameter twice).
                * Example filter for joined rides: `WHERE Rides.PassengerId = ?` (pass `{user_id}` as the parameter).
                * Example filter for driven rides: `WHERE Rides.DriverId = ?` (pass `{user_id}` as the parameter).
            4.  **IDs Context (`ids`)**:
                * If `{ids}` is provided and is not empty, it will be a JSON **array** of objects. Treat these as important identifiers to filter on.
                * Each object in the array has the structure: `{{"id": "VALUE", "type": "TYPE"}}`.
                    * `VALUE`: The actual ID value to filter by.
                    * `TYPE`: A string indicating which column this ID refers to.
                * **Process each object in the `{ids}` array:**
                    * Use the `type` string to determine the appropriate table and column based on the **Database Table Semantics & Relationships** section. Examples:
                        * `type: DriverId` -> `Rides.DriverId`
                        * `type: UserId` -> Map contextually (e.g., `Posts.UserId`, `Likes.UserId`, `Comments.UserId`, `RidePosts.UserId`, `CommentLikes.UserId`, `Friendships.UserId`, `Reports.ReportedBy`)
                        * `type: FriendId` -> `Friendships.FriendId`
                        * `type: PassengerId` -> `Rides.PassengerId`
                        * `type: SenderId` -> Contextually `Messages.SenderId` or `Notifications.SenderId`
                        * `type: ReceiverId` -> `Notifications.ReceiverId`
                        * `type: User1Id` -> `Conversations.UserId1`
                        * `type: User2Id` -> `Conversations.User2Id`
                        * `type: ReportedBy` -> `Reports.ReportedBy`
                        * `type: RidePostId` -> `Rides.RidePostId`
                        * `type: ConversationId` -> `Messages.ConversationId`
                        * `type: PostId` -> Map contextually (e.g., `Shares.PostId`, `Comments.PostId`, `Likes.PostId`, `Reports.PostId`)
                        * `type: CommentId` -> `CommentLikes.CommentId`
                        * `type: RideId` -> `Rides.Id`
                        * `type: RatedByUserId` ->`Users.RatedByUserId`,
                    * Add a `WHERE` clause (or `AND` if other conditions exist) to filter on this column using the `id` value from the object. Use a SQL placeholder (`?`) for the value. Example: `WHERE Rides.DriverId = ?`.
                * **Handling multiple IDs:**
                    * If the `{ids}` array contains multiple objects **with the same `type`**, combine them using an `IN` clause for that specific column. Example: If ids = [{{"id": "1", "type": "PostId"}}, {{"id": "2", "type": "PostId"}}],generate a condition like `WHERE RelevantTable.PostId IN (?, ?)`.
                    * If the `{ids}` array contains objects with *different* `type`s, apply each as a separate `AND` condition (unless query logic dictates `OR`). Example: `WHERE Rides.DriverId = ? AND Rides.RidePostId = ?`.
                * Assume the caller will bind the actual ID values (`VALUE`) safely to the `?` placeholders in the correct order.
            5.  **JOINs**:
                * When retrieving data that includes user information (e.g., post author, commenter, liker, friend, sender, receiver, driver, passenger, reporter), **JOIN** with the `Users` table using the appropriate foreign key (e.g., `Posts.UserId`, `Comments.UserId`, `Notifications.SenderId`, `Rides.PassengerId`, `Messages.SenderId`, `Reports.ReportedBy`, etc.).
                * Include relevant user details like `Users.FullName` in the `SELECT` list.
                * For `Friendships`, you may need to JOIN `Users` twice (once for `UserId`, once for `FriendId`) to get both users' details. Alias the Users table appropriately (e.g., `U1`, `U2`).
                * For `Conversations`, JOIN `Users` twice (on `UserId1` and `UserId2`).
                * For `Rides`, JOIN `Users` twice (on `DriverId` and `PassengerId`).
            6.  **Column Selection**: Columns in the `SELECT` list must only come from tables listed in the `FROM` or `JOIN` clauses. Validate column names against the provided `{schema}`.
            7.  **Placeholders**: Use SQL placeholders (`?`) for all dynamic values derived from the user query or context (`{user_id}`, search terms, ID values from `{ids}`, etc.).
            8. **Time Select**: If the question is related to time properties (latest, oldest, current,...etc) in SELECT, a time-related field is required.
            9. **If the query involves "all" use the TOP 10 statement to limit the number of records returned.**
            10.**Always apply the IsDelete = 0 filter to tables that have this column**
            12. ** WHITH RIDEPOSTS TABLE ALWAY USING WHERE (other conditions) AND rp.Status = 0 AND rp.StartTime >= ? AND rp.IsDeleted = 0
            11. **Note on using GROUPBY for count statements**
            **Example Table Configurations**:
            {{
            "RidePosts": {{
                "selected_columns": ["Id", "UserId", "StartLocation", "EndLocation", "StartTime", "Content", "Status"],
                "user_filters": "IsDeleted = 0 AND (UserId = ? OR Status = 0)",
                "user_id_fields": ["UserId"]
            }},
            "Rides":
            {{
                "selected_columns": ["Id", "PassengerId", "RidePostId", "DriverId", "StartTime", "Status"],
                "user_filters": "(CreatedAt IS NOT NULL) AND (PassengerId = ? OR DriverId = ?)",
                "user_id_fields": ["PassengerId", "DriverId"]
            }}
            **Table-specific Logic & Filters (Numeric Status/Type Codes):**
            {logic_str}
            **NOTE**: 
            * Questions involving counting, quantity, "how many", etc., must always perform a SELECT that includes all related IDs along with some corresponding details and the returned count.
            * Community-related questions must generate controlled and generalized queries that do not expose sensitive information, while still ensuring that the corresponding IDs are included in the results.
            * If the question is not related to the data or the system's tables, return False; otherwise, return True (Type).
            * If the user wants to know internal system information, return False(Type) and raise a warning(Alert).
            * Always SELECT columns in {avalble_columns} to match user query, no need to remove sensitive columns like phone number, Email, etc.
            **Table Configurations Format**:
            - `table_configs` is a JSON object where each key is a table name, and the value contains:
            - `selected_columns`: List of columns to select (or null for admin).
            - `user_filters`: SQL filter string for the 'user' role (or null for admin).
            - `user_id_fields`: List of columns that represent user IDs (e.g., ["UserId"], ["PassengerId", "DriverId"]).
            **Output Format:**
            Return a **strict JSON object** containing two keys:
            1.  `sql`: The generated SQL query string.
            2.  `params`: A list containing the values for the SQL placeholders (`?`) in the correct order.

            **Example (User asks: "Show me open ride offers going to Quang Trung")**:
            {{
                "sql": "SELECT P.Id, P.StartLocation, P.EndLocation, P.StartTime, P.Content, U.FullName AS PosterName,u.Id AS UserId FROM RidePosts P JOIN Users U ON P.UserId = U.Id WHERE P.EndLocation LIKE ? AND P.Status = 0 AND P.StartTime >= GETDATE()",
                "params": ["%Quang Trung%"]
            }}
            Example (User asks: "Who are my accepted friends?"):

            {{
                "sql": "SELECT F.Id, CASE WHEN F.UserId = ? THEN U2.Id ELSE U1.Id END AS FriendUserId, CASE WHEN F.UserId = ? THEN U2.FullName ELSE U1.FullName END AS FriendFullName FROM Friendships F JOIN Users U1 ON F.UserId = U1.Id JOIN Users U2 ON F.FriendId = U2.Id WHERE (F.UserId = ? OR F.FriendId = ?) AND F.Status = 1",
                "params": ["{user_id}", "{user_id}", "{user_id}", "{user_id}"] 
            }}
            Example (User asks: "Show my unread notifications about new messages"):

            {{
                "sql": "SELECT N.Id, N.Title, N.Content, N.CreatedAt, N.Url, U.FullName AS SenderName FROM Notifications N JOIN Users U ON N.SenderId = U.Id WHERE N.ReceiverId = ? AND N.Type = 3 AND N.IsRead = 0 ORDER BY N.CreatedAt DESC",
                "params": ["{user_id}"]
            }}
            Example (User asks: "với vai trò là tài xế thì tôi đã tham gia các chuyến đi nào,kèm theo thông tin của các hành khách mà tôi đã đi cùng"):
            {{
                "sql": "SELECT TOP 10 R.Id AS RideId, R.PassengerId, R.RidePostId, R.DriverId, R.StartTime, R.EndTime, R.EstimatedDuration, R.Status, R.Fare, R.CreatedAt, R.IsSafetyTrackingEnabled, U1.Id AS PassengerId, U1.FullName AS PassengerFullName, U2.Id AS DriverId, U2.FullName AS DriverFullName FROM Rides R JOIN Users U1 ON R.PassengerId = U1.Id JOIN Users U2 ON R.DriverId = U2.Id WHERE R.DriverId = ?",
                "params": ["{user_id}"]
            }}
""",
        )

        try:
            chain = sql_prompt | self.sql_llm
            start_time = time_module.time()
            async with asyncio.timeout(30.0):
                result = await chain.ainvoke(
                    {
                        "query": query,
                        "schema": schema_description,
                        "user_id": user_id,
                        "ids": ids if ids else "None",
                        "avalble_columns": avalble_columns,
                        "logic_str": logic_str,
                        "semantics_str": semantics_str,
                    }
                )
                # json.dumps(context) if context else "{}"
            logger.info(
                f"Generate SQL took {time_module.time() - start_time:.2f} seconds"
            )

            cleaned_content = re.sub(r"```json\n|\n```", "", result.content).strip()
            sql_data = json.loads(cleaned_content)
            sql = sql_data.get("sql", "")
            params = sql_data.get("params", [])
            logger.info(f"Generated SQL: {sql}, Params: {params}")
            params = [str(p).encode("utf-8").decode("utf-8") for p in params]
            context = {
                "query": query,
                "role": role,
                "user_id": user_id,
                "relevant_tables": relevant_tables,
                "ids": ids,
                "schema_description": schema_description,
                "avalble_columns": avalble_columns,
                "logic_str": logic_str,
                "semantics_str": semantics_str,
                "prompt": sql_prompt.format(
                    query=query,
                    schema=schema_description,
                    user_id=user_id,
                    ids=ids if ids else "None",
                    avalble_columns=avalble_columns,
                    logic_str=logic_str,
                    semantics_str=semantics_str,
                ),
            }
            return sql, params, context
        except Exception as e:
            logger.error(f"Error generating SQL: {str(e)}", exc_info=True)
            return "", [], {}

    # answer_generator.py

    async def _process_new_query_async(
        self,
        normalized_query: str,
        user_id: str,
        role: str,
        chat_history: List[Dict] = None,
        ids: Optional[List[Dict]] = None,
        relevant_tables: Optional[List[str]] = None,
    ) -> List[Dict]:
        """Process a new query by generating and executing an SQL query using provided normalized query and relevant tables."""
        logger.info(
            f"Processing new query: {normalized_query}, UserId: {user_id}, Role: {role}, Relevant tables: {relevant_tables}"
        )

        # Kiểm tra normalized_query và relevant_tables
        if not normalized_query:
            logger.error("Normalized query is empty")
            return []
        if not relevant_tables:
            logger.warning("No relevant tables provided, returning empty result")
            return []

        logger.debug("Checking approved SQL cache")

        logger.debug("Checking generated SQL cache")
        cached_sql = await self.data_loader.get_generated_sql(normalized_query, user_id)

        generated_sql_id = None
        if cached_sql:
            sql_query, params = cached_sql["sql"], cached_sql["params"]
            generated_sql_id = cached_sql.get("GeneratedSQLId")
            logger.info(
                f"Using cached SQL for query: {normalized_query}, GeneratedSQLId: {generated_sql_id}"
            )
        else:
            logger.debug("Generating new SQL query")
            sql_query, params, context = await self._generate_sql_query(
                normalized_query, role, user_id, relevant_tables, ids
            )
            if not sql_query:
                logger.error("No SQL query generated")
                return []
            generated_sql_id = str(uuid.uuid4())
            logger.info(f"Generating new SQL with ID: {generated_sql_id}")
            # await self.data_loader.save_generated_sql(sql_query, params, user_id, generated_sql_id)

        logger.info(f"Preparing SQL params: {params}")
        params = [str(user_id) if p == "user_id" else p for p in params]

        try:
            logger.info(f"Executing SQL query: {sql_query}")
            results = await self.data_loader._execute_query_llm_async(
                sql_query, tuple(params), context
            )
            # gọi lại LLM
            logger.info(f"SQL query executed, found {len(results)} results")
            return results
        except Exception as e:
            logger.error(f"Error processing new query: {str(e)}", exc_info=True)
            return []

    async def generate_answer_stream_async(
        self,
        query: str,
        user_id: str,
        conversation_id: str,
        role: str,
        chat_history: List[Dict] = None,
        ids: Optional[List[Dict]] = None,
        relevant_tables: Optional[List[str]] = None,
        normalized_query: Optional[str] = None,
        action_type=str,
        state_key=str,
    ) -> AsyncIterator[Dict]:
        """Gene`rate a streaming response with chunks and a final data payload after streaming completes."""
        logger.info(
            f"Streaming query async: {query}, ConversationId: {conversation_id}, CPU: {psutil.cpu_percent()}%, RAM: {psutil.virtual_memory().percent}%"
        )

        def _format_chat_history_for_stream(chat_history: List[Dict]) -> List[Dict]:
            """Format chat history for _stream_response, including only Query and Answer."""
            formatted = []
            for message in chat_history or []:
                role = message.get("role")
                if role == "user":
                    content = message.get("content", "")
                elif role == "assistant":
                    # Chỉ lấy trường 'answer' từ content
                    content = (
                        message.get("content", {}).get("answer", "")
                        if isinstance(message.get("content"), dict)
                        else message.get("content", "")
                    )
                else:
                    continue
                if content:  # Bỏ qua nếu content rỗng
                    formatted.append({"role": role, "content": content})
            return formatted

        if not isinstance(query, str):
            logger.error(f"Query must be a string, got {type(query)}")
            yield {"type": "error", "content": "Câu hỏi không hợp lệ."}
            return

        try:
            query = query.encode().decode("utf-8", errors="replace")
            if relevant_tables is None or normalized_query is None:
                logger.info("Preprocessing query")
                preprocess_result = await self._preprocess_query_async(query)
                self.normalized_query = preprocess_result["normalized_query"]
                self.relevant_tables = preprocess_result["relevant_tables"]

            else:
                self.normalized_query = normalized_query
                self.relevant_tables = relevant_tables
            logger.info(
                f"Using query: {self.normalized_query}, relevant_tables: {self.relevant_tables}"
            )

            try:
                user_id = str(uuid.UUID(user_id)) if user_id else None
            except ValueError:
                logger.error(f"Invalid UserId: {user_id}")
                yield {"type": "error", "content": "ID người dùng không hợp lệ."}
                return

            # Gọi _process_new_query_async để lấy dữ liệu chính
            try:
                async with self.sql_cache_locks[user_id]:
                    logger.debug("Calling _process_new_query_async")
                    results = await self._process_new_query_async(
                        self.normalized_query,
                        user_id,
                        role,
                        chat_history,
                        ids or [],
                        self.relevant_tables,
                    )
                    logger.info(
                        f"_process_new_query_async returned: {len(results)} records"
                    )
            except asyncio.TimeoutError:
                logger.error("Timeout while acquiring sql_cache_lock")
                yield {
                    "type": "error",
                    "content": "Hệ thống bận, vui lòng thử lại sau.",
                }
                return
            formatted_history = _format_chat_history_for_stream(chat_history)
            response_chunks = []
            async for chunk in self._stream_response(
                results,
                self.normalized_query,
                user_id,
                role,
                self.relevant_tables,
                formatted_history or [],
            ):
                response_chunks.append(chunk)
                yield {"type": "chunk", "content": chunk}

            # Gộp response cho chunk final
            full_response = "".join(response_chunks)
            token_count = self._count_tokens(full_response)

            yield {
                "type": "final",
                "data": {
                    "normalized_query": self.normalized_query,
                    "response": full_response,
                    "token_count": token_count,
                    "results": results,
                    "type": action_type,
                },
            }

        except Exception as e:
            logger.error(
                f"Error in generate_answer_stream_async: {str(e)}", exc_info=True
            )
            yield {
                "type": "error",
                "content": "Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại.",
            }

    def _remove_icons(self, text: str) -> str:
        """Remove emojis and icons from the text."""
        # Loại bỏ emoji
        text = emoji.replace_emoji(text, replace="")
        # Loại bỏ các ký tự đặc biệt không cần thiết (giữ chữ, số, dấu cách, và dấu câu cơ bản)
        text = re.sub(r"[^\w\s.,!?]", "", text)
        return text.strip()

    def _count_tokens(self, text: str) -> int:
        """Count the number of tokens in the text (approximation based on words)."""
        words = text.split()
        return len(words)  # Mỗi từ được coi là một token (gần đúng)

    # answer_generator.py
    async def _stream_response(
        self,
        context: List[Dict],  # Nhận context dưới dạng List[Dict]
        question: str,
        user_id: str,
        role: str,
        tables: List[str],
        chat_history: List[Dict],
    ) -> AsyncIterator[str]:
        """Streams the response from the LLM, using table_configs to guide column display."""
        use_chat_history = chat_history and any(
            msg.get("content") for msg in chat_history
        )
        logger.info(f"Using chat history: {use_chat_history}")
        full_response_for_logging = ""
        print("context", context)
        # Lấy query_columns từ context hoặc từ kết quả truy vấn
        query_columns = (
            [key for key in context[0].keys()]
            if context and isinstance(context[0], dict)
            else []
        )
        results = self._determine_is_own_data(
            context, user_id, tables, role, query_columns
        )
        print("results", results)
        template = """
        👋 Xin chào! Dựa trên câu hỏi của bạn và thông tin dưới đây, tôi sẽ cố gắng đưa ra câu trả lời tự nhiên, dễ hiểu và đầy đủ thông tin nhất:

            ❓ Câu hỏi của người dùng:
            {question}
            💬 Lịch sử chat trước đó:
            {chat_history}

            🔍 Thông tin tìm được:
            {context}


            **Hướng dẫn hiển thị**:
            - Phải trả về đúng url,hoặc đường dẫn ảnh nếu có trong {{context}},không được chuyển nó thành chữ.
            - Trong thông tin tìm được sẽ có cột `isOwner` cho biết người dùng có phải là chủ sở hữu của dữ liệu hay không. Nếu là chủ sở hữu, bạn có thể hiển thị thông tin chi tiết hơn về dữ liệu đó.
            - Nếu `isOwner` là True, bạn hãy trả lời theo kiểu "Đây là thông tin của bạn".
            - Nếu UserId và Id của bảng Rideposts thì vẫn trả về UserId và Id của bảng Rideposts.
            🧠 Ghi chú về trạng thái và loại dữ liệu:

            - **RidePosts:**
            - `PostType`: 0 = "Di chuyển", 1 = "Tài liệu học tập", 2 = "Trao đổi", 3 = "Nhóm học tập", 4 = "Thảo luận"
            - `Status`: 0 = "Đang mở", 1 = "Đã tìm được người đi chung", 2 = "Bị hủy"
            - `PostRideType`: 0 = "Đăng chuyến đi", 1 = "Yêu cầu chuyến đi"

            - **Rides:**
            - `Status`: 0 = "Đang chờ", 1 = "Đã chấp nhận", 2 = "Bị từ chối", 3 = "Hoàn thành"

            - **Friendships:**
            - `Status`: 0 = "Đang chờ xác nhận", 1 = "Đã kết bạn", 2 = "Đã từ chối", 3 = "Đã hủy kết bạn"

            - **Groups:**
            - `Privacy`: 0 = "Công khai", 1 = "Riêng tư", 2 = "Bí mật"
            - `Role`: 0 = "Thành viên", 1 = "Quản trị viên", 2 = "Chủ nhóm"

            - **Reports:**
            - `Status`: 0 = "Đang chờ", 1 = "Đã xem xét", 2 = "Bị từ chối"

            - **Users:**
            - `Role`: 0 = "Người dùng", 1 = "Quản trị viên"

            - **Alerts:**
            - `Type`: 0 = "Tài xế tắt GPS", 1 = "Chuyến đi bị trễ", 2 = "Không phản hồi"

            - **Ratings:**
            - `Level`: 0 = "Kém", 1 = "Trung bình", 2 = "Tốt", 3 = "Xuất sắc"

            - **Messages:**
            - `Status`: 0 = "Đã gửi", 1 = "Đã nhận", 2 = "Đã xem"

            - **Notifications:**
            - `Type`: 
                - 0 = "Bài viết được thích", 1 = "Bài viết được bình luận", 2 = "Bài viết được chia sẻ", 
                - 3 = "Tin nhắn mới", 4 = "Yêu cầu kết bạn mới", 5 = "Lời mời đi chung", 
                - 6 = "Cảnh báo hệ thống", 7 = "Gửi yêu cầu kết bạn", 
                - 8 = "Chấp nhận kết bạn", 9 = "Từ chối kết bạn"
            - Điểm uy tín từ 0 -> 10 : Kém
            - Điểm uy tín từ 20 -> 40 : Trung bình
            - Điểm uy tín từ 40 -> 60 : Khá
            - Điểm uy tín từ 60 -> 80 : Tốt
            - Điểm uy tín từ 80 trở lên : Tin cậy cực kì cao
            💡 Ghi chú nhanh:
            - Vui lòng xem xét lịch sử trò chuyện nếu câu hỏi liên quan trực tiếp đến các tin nhắn trước.
            - Câu trả lời cần hiển thị đầy đủ thông tin dựa trên câu hỏi và dữ liệu tìm thấy, rõ ràng, dễ hiểu và sử dụng mô tả thay vì giá trị số.      
            - Các cột về thời gian (như `CreatedAt`, `UpdatedAt`) sẽ được định dạng theo định dạng "Ngày/tháng/năm Giờ:Phút" của VIỆT NAM và đó sẽ là dữ liệu liên quan đến thời gian mà người dùng cần tìm trong câu hỏi.
            - Chỉ trả về thời gian là ngay tháng năm nếu trong câu hỏi người dùng không có yêu cầu về thời gian cụ thể.
            - Câu hỏi người dùng liên quan đến các thuật ngữ về tìm kiếm như "tìm kiếm", "tìm", "tìm hiểu", "tra cứu", "kiểm tra", "xem", "thông tin", "hỏi", "đặt câu hỏi" và dữ liệu bạn nhận được chắc chắn liên quan đến sự tìm kiếm đó hãy trả lời cho đúng.
            - Sử dụng biểu tượng cảm xúc để tăng tính thân thiện như 👋, 💬, 🔍, ❓, 💡, 😔, 😊,...
            - Nếu dữ liệu không có hãy trả lời: "Xin lỗi, tôi không tìm thấy thông tin bạn cần 😔." kèm theo một câu hỏi mở liên quan đến câu hỏi hiện tại của người dùng.
            - Trả lời bằng tiếng Việt.
            - **LUÔN LUÔN HIỂN THỊ Id VÀ UserId CHO DỮ LIỆU LẤY ĐƯỢC TỪ BẢNG RIDEPOSTS TỨC LÀ DỮ LIỆU LIÊN QUAN ĐẾN CHUYẾN ĐI, VÌ 2 ID NÀY CỰC KÌ QUANG TRỌNG, KHÔNG ĐƯỢC PHÉP LOẠI BỎ NÓ**
            - Đặc biệt không được phép sử dụng các thuật ngữ trong lập trình như Id,các cột trong dữ liệu {{context}},phải chuyển đổi chúng sang một ngôn ngữ tự nhiên và hợp lý cho người dùng hiểu.
            ví dụ: dữ liệu trong {{context}} chứa 'Id': 'https://duy-tan-sharing-system.vercel.app/profile/CFA82DCE-5902-4419-A6A1-3D8066BAD303', 'Content': 'hôm nay tôi vui quá', 'ImageUrl': '/images/posts/ad321db4-39a7-4b7c-b59a-e19a270bf860.jpg','ProfilePicture': '/images/profile/avatar/4de96800-48ec-4fed-abbb-0ee377c2f107.jpg'
            thì bạn phải chuyển thành : link bài đăng: 'https://duy-tan-sharing-system.vercel.app/D2487B39-F5AA-4701-AD86-C3A1A77048C3', Trang cá nhân của {{Tên người đó nếu có}}: 'https://duy-tan-sharing-system.vercel.app/profile/CFA82DCE-5902-4419-A6A1-3D8066BAD303','/images/posts/ad321db4-39a7-4b7c-b59a-e19a270bf860.jpg',Ảnh đại diện: '/images/profile/avatar/4de96800-48ec-4fed-abbb-0ee377c2f107.jpg'
            - **CHÚ Ý**: 
                1. Nếu dữ liệu không có hoặc không liên quan, bạn có thể trả lời dựa vào các câu hỏi trước đó trong lịch sử trò chuyện, nhưng không được tự động tạo dữ liệu mới hoặc giả mạo thông tin. Hãy trung thực và rõ ràng trong câu trả lời của bạn.
                2. Bạn có thể trả lời các câu hỏi dựa trên dữ liệu từ website, ví dụ: "Người dùng hỏi trên chuyến đi đến Quang Trung, có những quán ăn nào không?" thì bạn có thể trả lời như: "Có một số quán ăn nổi tiếng như Phở Hòa, Bánh mì Huỳnh Hoa, Bún bò Huế,..." Nhưng phải dựa vào địa điểm đi và đến.
                3. Bạn có thể gợi ý những câu hỏi mở khác liên quan đến câu hỏi hiện tại của người dùng mà không cần dữ liệu cụ thể từ hệ thống. Ví dụ: "Bạn có muốn tôi tìm kiếm tài liệu, bài học tương tự trên web không?" hoặc "Có điều gì khác mà tôi có thể giúp bạn không?".
                4. `isOwner` không liên quan gì đến việc hiển thị link,url cả.
                5. Dữ liệu được trả về chắc chắn liên quan đến câu hỏi {{question}} nên phải trả lời cho đúng. 
                6. Không lặp lại các URL.
                ví dụ thế này là sai:" **Link bài đăng:** [https://duy-tan-sharing-system.vercel.app/post/772E761C-E421-4650-A623-CD45FA76B77A](http://localhost:3000/post/772E761C-E421-4650-A623-CD45FA76B77A)"
                ví dụ đúng:  **Link bài đăng:** https://duy-tan-sharing-system.vercel.app/post/772E761C-E421-4650-A623-CD45FA76B77A"
                7. Nếu xuật hiện dữ liệu liên quan đến Hình ảnh, Video bạn phải tự nối chuỗi url với base_url của hệ thống, ví dụ: nếu base_url là "https://universharing-web-app-gaereaceg0drc5e3.southeastasia-01.azurewebsites.net" và dữ liệu có trường "ImageUrl": "/images/posts/ad321db4-39a7-4b7c-b59a-e19a270bf860.jpg" thì bạn phải trả về "https://universharing-web-app-gaereaceg0drc5e3.southeastasia-01.azurewebsites.net/images/posts/ad321db4-39a7-4b7c-b59a-e19a270bf860.jpg"
                8. Phải luôn chuyển các trường trong context sang tiếng Việt, không được để nguyên tiếng Anh hoặc các từ viết tắt.
                9. Không được hiển thị các ký tự trong code như `Id`, `UserId`, `Content`, `ImageUrl`, `ProfilePicture`,`IsOwner`... mà phải chuyển sang tiếng Việt tự nhiên. 
                10. Không được chuyển {{"UserId", "Id"}} trong Bảng Rideposts thành link, url mà phải chuyển thành "Id của bài đăng" hoặc "Id của tài xế" và vẫn được phép hiển thị.
            * NHẮC LẠI LẦN NỮA LÀ :**LUÔN LUÔN HIỂN THỊ Id VÀ UserId CHO DỮ LIỆU LẤY ĐƯỢC TỪ BẢNG RIDEPOSTS TỨC LÀ DỮ LIỆU LIÊN QUAN ĐẾN CHUYẾN ĐI, VÌ 2 ID NÀY CỰC KÌ QUANG TRỌNG, KHÔNG ĐƯỢC PHÉP LOẠI BỎ NÓ**
                ví dụ:
                {{context}}:
                {{
                "context": [
                    {{
                    "Id": "575D713E-5E88-4F16-A589-25FB2B5D9DA8",
                    "UserId": "2D288A58-2D60-4B2F-BFCF-81B97F28A62C",
                    "StartLocation": "Đường Dương Cát Lợi, Phường Hòa Khánh Nam, Quận Liên Chiểu, Đà Nẵng, Việt Nam",
                    "EndLocation": "182 Đường Nguyễn Văn Linh, Phường Thạc Gián, Quận Thanh Khê, Đà Nẵng, Việt Nam",
                    "StartTime": "2025-05-26T12:46:00",
                    "PostType": 0,
                    "Status": 0,
                    "CreatedAt": "2025-05-26T11:46:33.447000",
                    "Content": "Câcc",
                    "LatLonStart": "16.0497708,108.159375",
                    "LatLonEnd": "16.05997,108.20988",
                    "UpdatedAt": null,
                    "IsDeleted": false,
                    "isOwner": true
                    }},
                    {{
                    "Id": "3228EAA6-710A-4CF0-9384-35D223DC64EE",
                    "UserId": "859EA4A4-8E82-461D-83BA-2D979045840B",
                    "StartLocation": "Lucky Spa, Phường Hòa Thuận Tây, Quận Hải Châu, Đà Nẵng, Việt Nam",
                    "EndLocation": "21 Đường Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng, Việt Nam",
                    "StartTime": "2025-05-27T03:24:00",
                    "PostType": 0,
                    "Status": 0,
                    "CreatedAt": "2025-05-26T17:14:29.117000",
                    "Content": "Chia sẻ xe đi đến cơ sở Nguyễn Văn Linh, ai đi cùng mình không",
                    "LatLonStart": "16.054407,108.202167",
                    "LatLonEnd": "16.06024,108.21543",
                    "UpdatedAt": null,
                    "IsDeleted": false,
                    "isOwner": false
                    }},
                    {{
                    "Id": "EC96E41D-B8E7-476C-B962-C7CC9DCDE255",
                    "UserId": "A648218C-F5A8-465E-AAEC-E9E228DCC86F",
                    "StartLocation": "Lucky Spa, Phường Hòa Thuận Tây, Quận Hải Châu, Đà Nẵng, Việt Nam",
                    "EndLocation": "21 Đường Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng, Việt Nam",
                    "StartTime": "2025-05-28T03:45:00",
                    "PostType": 0,
                    "Status": 0,
                    "CreatedAt": "2025-05-26T16:43:02.233000",
                    "Content": "Tìm người đồng hành di chuyển đến cơ sở Nguyễn Văn Linh, ai có nhu cầu tham gia với mình cho vui",
                    "LatLonStart": "16.054407,108.202167",
                    "LatLonEnd": "16.06024,108.21543",
                    "UpdatedAt": null,
                    "IsDeleted": false,
                    "isOwner": false
                    }},
                    {{
                    "Id": "4A120784-0BD9-462E-963D-CF861B6874B1",
                    "UserId": "6A004EF5-78A6-4708-8D19-7EE312B74C7D",
                    "StartLocation": "352 Đường Hoàng Văn Thái, Phường Hòa Khánh Nam, Quận Liên Chiểu, Đà Nẵng, Việt Nam",
                    "EndLocation": "329 Đường Nguyễn Văn Linh, Phường Thạc Gián, Quận Thanh Khê, Đà Nẵng, Việt Nam",
                    "StartTime": "2025-05-28T03:00:00",
                    "PostType": 0,
                    "Status": 0,
                    "CreatedAt": "2025-05-26T17:02:44.963000",
                    "Content": "Mình có chuyến di chuyển từ Hòa Khánh sang NVL",
                    "LatLonStart": "16.05134,108.15105",
                    "LatLonEnd": "16.05948,108.2085",
                    "UpdatedAt": null,
                    "IsDeleted": false,
                    "isOwner": false
                    }},
                    {{
                    "Id": "29DB0512-14DF-43DF-824E-E2A88366F334",
                    "UserId": "14EBFD16-1C29-42C8-AAF1-64D6E5594524",
                    "StartLocation": "10 Hẻm H05 Đường Tống Duy Tân, Phường Hòa Minh, Quận Liên Chiểu, Đà Nẵng, Việt Nam",
                    "EndLocation": "182 Đường Nguyễn Văn Linh, Phường Thạc Gián, Quận Thanh Khê, Đà Nẵng, Việt Nam",
                    "StartTime": "2025-05-28T07:23:00",
                    "PostType": 0,
                    "Status": 0,
                    "CreatedAt": "2025-05-26T16:23:22.617000",
                    "Content": "Cần ghép với 1 bạn nữ, haha",
                    "LatLonStart": "16.05854,108.16926",
                    "LatLonEnd": "16.05997,108.20988",
                    "UpdatedAt": null,
                    "IsDeleted": false,
                    "isOwner": false
                    }},
                    {{
                    "Id": "8C58E7E0-21F2-479F-965F-FCC37D6AD801",
                    "UserId": "1CEAF02B-347E-4B42-ADF7-EA3722803D00",
                    "StartLocation": "352 Đường Hoàng Văn Thái, Phường Hòa Khánh Nam, Quận Liên Chiểu, Đà Nẵng, Việt Nam",
                    "EndLocation": "329 Đường Nguyễn Văn Linh, Phường Thạc Gián, Quận Thanh Khê, Đà Nẵng, Việt Nam",
                    "StartTime": "2025-05-29T06:00:00",
                    "PostType": 0,
                    "Status": 0,
                    "CreatedAt": "2025-05-26T17:00:14.037000",
                    "Content": "Cần di chuyển từ Hòa Khánh đến NVL",
                    "LatLonStart": "16.05134,108.15105",
                    "LatLonEnd": "16.05948,108.2085",
                    "UpdatedAt": null,
                    "IsDeleted": false,
                    "isOwner": false
                    }}
                ],
                "token_count": 396,
                "type": "SEARCH"
                }}
                thì phải trả lời như sau:
                👋 Xin chào! Dựa trên thông tin tìm được, hiện tại có một số chuyến đi đang mở đến đường Nguyễn Văn Linh, Đà Nẵng:

                Ngày 26/05/2025, 12:46: Từ đường Dương Cát Lợi đến 182 đường Nguyễn Văn Linh. Chủ bài đăng có nội dung: "Câcc". Id của bài đăng: 575D713E-5E88-4F16-A589-25FB2B5D9DA8, Id của tài xế: 2D288A58-2D60-4B2F-BFCF-81B97F28A62C.
                Ngày 27/05/2025, 03:24: Từ Lucky Spa đến 21 đường Nguyễn Văn Linh. Nội dung: "Chia sẻ xe đi đến cơ sở Nguyễn Văn Linh, ai đi cùng mình không". Id của bài đăng: 3228EAA6-710A-4CF0-9384-35D223DC64EE, Id của tài xế: 859EA4A4-8E82-461D-83BA-2D979045840B.
                Ngày 28/05/2025, 03:00: Từ 352 đường Hoàng Văn Thái đến 329 đường Nguyễn Văn Linh. Nội dung: "Mình có chuyến di chuyển từ Hòa Khánh sang NVL". Id của bài đăng: 4A120784-0BD9-462E-963D-CF861B6874B1, Id của tài xế: 6A004EF5-78A6-4708-8D19-7EE312B74C7D.
                Ngày 28/05/2025, 03:45: Từ Lucky Spa đến 21 đường Nguyễn Văn Linh. Nội dung: "Tìm người đồng hành di chuyển đến cơ sở Nguyễn Văn Linh, ai có nhu cầu tham gia với mình cho vui". Id của bài đăng: EC96E41D-B8E7-476C-B962-C7CC9DCDE255, Id của tài xế: A648218C-F5A8-465E-AAEC-E9E228DCC86F.
                Ngày 28/05/2025, 07:23: Từ 10 Hẻm H05 đường Tống Duy Tân đến 182 đường Nguyễn Văn Linh. Nội dung: "Cần ghép với 1 bạn nữ, haha". Id của bài đăng: 29DB0512-14DF-43DF-824E-E2A88366F334, Id của tài xế: 14EBFD16-1C29-42C8-AAF1-64D6E5594524.
                Ngày 29/05/2025, 06:00: Từ 352 đường Hoàng Văn Thái đến 329 đường Nguyễn Văn Linh. Nội dung: "Cần di chuyển từ Hòa Khánh đến NVL". Id của bài đăng: 8C58E7E0-21F2-479F-965F-FCC37D6AD801, Id của tài xế: 1CEAF02B-347E-4B42-ADF7-EA3722803D00.
                Bạn có muốn biết thêm thông tin chi tiết về chuyến đi nào không? 😊

        """
        prompt = PromptTemplate(
            input_variables=["chat_history", "context", "question"],
            template=template.strip(),
        )
        chain = prompt | self.llm
        # Định dạng chat_history cho prompt
        formatted_chat_history = (
            "\n".join(
                f"{msg['role']}: {msg['content']}"
                for msg in chat_history
                if msg.get("content")
            )
            or "Không có lịch sử trò chuyện."
        )
        response_stream = chain.astream(
            {
                "question": question,
                "context": results,
                "chat_history": formatted_chat_history
                or "Không có lịch sử trò chuyện.",
            }
        )

        logger.info("Starting to receive chunks from LLM stream...")
        try:
            async for chunk in response_stream:
                content = getattr(chunk, "content", str(chunk))
                if content:
                    full_response_for_logging += content
                    logger.info(f"Yielding raw chunk: '{content}'")
                    yield content
            logger.info("Finished streaming response.")
            logger.info(
                f"Full response generated by LLM: '{full_response_for_logging}'"
            )
        except Exception as e:
            logger.error(f"Error during streaming response: {str(e)}", exc_info=True)
            yield "Đã xảy ra lỗi trong quá trình tạo câu trả lời."

    def _determine_is_own_data(
        self,
        results: List[Dict[str, any]],
        user_id: str,
        relevant_tables: List[str],
        user_role: str,
        query_columns: Optional[List[str]] = None,  # Thêm tham số mới
    ) -> List[Dict[str, any]]:
        user_id_lower = str(user_id).lower()
        user_role = user_role.lower()

        # Nếu có query_columns, xác định các trường alias
        alias_columns = set(query_columns or []) - set(
            col
            for table in relevant_tables
            for col in self.data_loader.table_config.get(table, {}).get("columns", [])
        )

        for record in results:
            is_owner = False
            own_columns_set = set()
            allowed_columns_set = set()

            for table in relevant_tables:
                table_config = self.data_loader.table_config.get(table, {}) or {}
                user_id_fields = table_config.get("user_id_fields", [])

                # Gộp các cột được phép theo role
                permissions = table_config.get("permissions", {}).get(user_role, {})
                own_columns_set.update(permissions.get("own_columns", []))
                allowed_columns_set.update(permissions.get("allowed_columns", []))

                # Kiểm tra sở hữu
                for field in user_id_fields:
                    value = record.get(field)
                    if value and str(value).lower() == user_id_lower:
                        is_owner = True
                        break

                # Các trường hợp đặc biệt
                if table == "Friendships" and not is_owner:
                    if (
                        str(record.get("FriendId", "")).lower() == user_id_lower
                        and record.get("Status") == 1
                    ):
                        is_owner = True
                elif table == "Conversations" and not is_owner:
                    if (
                        str(record.get("User1Id", "")).lower() == user_id_lower
                        or str(record.get("User2Id", "")).lower() == user_id_lower
                    ):
                        is_owner = True

                if is_owner:
                    break

            # Gắn cờ
            record["isOwner"] = is_owner
            final_allowed_fields = own_columns_set if is_owner else allowed_columns_set

            # Thêm các trường alias vào final_allowed_fields
            final_allowed_fields.update(alias_columns)

            # Thay ID thành link nếu được phép
            for field in list(record.keys()):
                value = record[field]

                # Bỏ qua nếu không có quyền
                if field not in final_allowed_fields and field not in [
                    "isOwner",
                    "visible_fields",
                ]:
                    record[field] = "Không có quyền truy cập"
                    continue

                # Bỏ qua nếu không phải string
                if not isinstance(value, str):
                    continue
                # Nếu là đường dẫn ảnh bắt đầu bằng "/images/", thêm URL đầy đủ
                if isinstance(value, str) and value.startswith("/images/"):
                    record[field] = f"{NETCORE_API_URL}{value}"
                    continue  # Không cần mapping nữa
                if isinstance(value, str) and value.startswith("/videos/"):
                    record[field] = f"{NETCORE_API_URL}{value}"
                    continue  # Không cần mapping nữa
                # 1. Mapping cụ thể theo bảng hiện tại
                replaced = False
                for table in relevant_tables:
                    mapping = self.mappings.get(table, {})
                    if isinstance(mapping, dict) and field in mapping:
                        endpoint = mapping[field]
                        record[field] = (
                            f"{self.base_url}{endpoint.replace('{id}', value)}"
                        )
                        replaced = True
                        break
                    elif isinstance(mapping, str) and field == "Id":
                        # Chặn riêng trường Id của bảng RidePosts không được map
                        if table == "RidePosts":
                            continue
                        record[field] = (
                            f"{self.base_url}{mapping.replace('{id}', value)}"
                        )
                        replaced = True
                        break

                # 2. Nếu field kết thúc bằng Id (UserId, PostId,...) nhưng bỏ qua UserId và Id trong bảng RidePosts
                if not replaced and field.endswith("Id"):
                    # Bỏ qua chuyển đổi nếu field là UserId hoặc Id và bảng hiện tại là RidePosts
                    if not (table == "RidePosts" and field in ["UserId", "Id"]):
                        ref_table = field[:-2] + "s"  # Ví dụ: UserId -> Users
                        endpoint = self.mappings.get(ref_table)
                        if isinstance(endpoint, str):
                            record[field] = (
                                f"{self.base_url}{endpoint.replace('{id}', value)}"
                            )

        return results
