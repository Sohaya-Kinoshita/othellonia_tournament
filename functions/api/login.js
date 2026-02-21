const users = {
  "admin": {
    "password": "admin123",
    "role": "admin"
  },
  "user1": {
    "password": "user123",
    "role": "team_representative"
  },
  "user2": {
    "password": "user456",
    "role": "viewer"
  }
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'メソッドが許可されていません' })
    };
  }

  try {
    const { userId, password } = JSON.parse(event.body);

    if (!userId || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'ユーザーIDとパスワードを入力してください' })
      };
    }

    const user = users[userId];

    if (!user || user.password !== password) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: 'ユーザーIDまたはパスワードが正しくありません' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        role: user.role,
        message: 'ログインしました'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'サーバーエラー' })
    };
  }
};
