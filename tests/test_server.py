import os
import unittest

from server import is_allowed_model_endpoint, normalize_chat_endpoint


class ModelEndpointTests(unittest.TestCase):
    def setUp(self):
        self.previous_hosts = os.environ.get('AI_ALLOWED_HOSTS')

    def tearDown(self):
        if self.previous_hosts is None:
            os.environ.pop('AI_ALLOWED_HOSTS', None)
        else:
            os.environ['AI_ALLOWED_HOSTS'] = self.previous_hosts

    def test_normalizes_a_provider_base_url(self):
        self.assertEqual(
            normalize_chat_endpoint('https://api.deepseek.com'),
            'https://api.deepseek.com/chat/completions',
        )

    def test_rejects_insecure_and_unknown_endpoints(self):
        self.assertFalse(is_allowed_model_endpoint('http://api.deepseek.com/chat/completions'))
        self.assertFalse(is_allowed_model_endpoint('https://example.invalid/chat/completions'))

    def test_allows_explicitly_configured_provider(self):
        os.environ['AI_ALLOWED_HOSTS'] = 'models.example.com'
        self.assertTrue(is_allowed_model_endpoint('https://models.example.com/v1/chat/completions'))


if __name__ == '__main__':
    unittest.main()
