'use strict';

/**
 * Likes routes blueprint.
 *
 * POST /api/like — toggle like/dislike on a book
 */

const express = require('express');

const cache = require('../cache');
const { CACHE_KEYS } = require('../config');
const { authenticateToken } = require('../middleware/auth');
const { withClient } = require('../utils/dbHelpers');

const router = express.Router();

router.post('/api/like', authenticateToken, async (req, res) => {
  const { bookId, liked } = req.body;

  // Both fields are mandatory: bookId identifies the target book,
  // liked is a boolean (true = like, false = dislike).
  if (bookId == null || typeof liked !== 'boolean') {
    return res.status(400).json({ message: 'bookId and liked are required' });
  }

  try {
    const payload = await withClient(async (client) => {
      const isAdmin = Boolean(req.user?.isAdmin);
      const actorId = Number(req.user?.id);

      if (!Number.isInteger(actorId)) {
        throw new TypeError('Unable to resolve current user identity.');
      }

      // Admins record votes in admin_book_likes; regular users use user_book_likes.
      // Both tables have a UNIQUE (actor_id, book_id) constraint, so each person
      // can hold at most one opinion per book at any time.
      const likesTable = isAdmin ? 'admin_book_likes' : 'user_book_likes';
      const actorColumn = isAdmin ? 'admin_id' : 'user_id';

      // Check whether this actor has already voted on this book.
      const existingVote = await client.query(
        `
          SELECT liked
          FROM ${likesTable}
          WHERE ${actorColumn} = $1 AND book_id = $2
          LIMIT 1;
        `,
        [actorId, bookId]
      );

      let currentVote = liked;

      if (existingVote.rows.length > 0) {
        const previousVote = existingVote.rows[0].liked;

        if (previousVote === liked) {
          // Clicking the same button again toggles it OFF — remove the row.
          await client.query(
            `
              DELETE FROM ${likesTable}
              WHERE ${actorColumn} = $1 AND book_id = $2;
            `,
            [actorId, bookId]
          );
          currentVote = null; // no active vote
        } else {
          // Switching from like→dislike or dislike→like — UPDATE the existing row.
          await client.query(
            `
              UPDATE ${likesTable}
              SET liked = $3, likedon = NOW()::date
              WHERE ${actorColumn} = $1 AND book_id = $2;
            `,
            [actorId, bookId, liked]
          );
          currentVote = liked;
        }
      } else {
        // First vote on this book — INSERT a new row.
        await client.query(
          `
            INSERT INTO ${likesTable} (${actorColumn}, book_id, liked, likedon)
            VALUES ($1, $2, $3, NOW()::date);
          `,
          [actorId, bookId, liked]
        );
      }

      // Recount votes from BOTH tables so the running total is always accurate.
      const countsResult = await client.query(
        `
          SELECT
            COALESCE(SUM(CASE WHEN liked THEN 1 ELSE 0 END), 0)::int AS likes,
            COALESCE(SUM(CASE WHEN NOT liked THEN 1 ELSE 0 END), 0)::int AS dislikes
          FROM (
            SELECT book_id, liked FROM user_book_likes
            UNION ALL
            SELECT book_id, liked FROM admin_book_likes
          ) all_votes
          WHERE book_id = $1;
        `,
        [bookId]
      );

      const counts = countsResult.rows[0];

      // Persist the formatted summary back into books.like_dislike so the
      // homepage query can read it cheaply without a join.
      await client.query(
        `
          UPDATE books
          SET like_dislike = $2
          WHERE id = $1;
        `,
        [bookId, `${counts.likes} Likes / ${counts.dislikes} Dislikes`]
      );

      return {
        ...counts,
        currentVote,
      };
    });

    // Like-counts embedded in homepage cache are now stale — evict proactively.
    cache.del(CACHE_KEYS.HOMEPAGE).catch(() => {});
    return res.json({ message: 'Success', likes: payload.likes, dislikes: payload.dislikes, currentVote: payload.currentVote });
  } catch (error) {
    // Invalidate homepage cache since like-counts changed
    await cache.del(CACHE_KEYS.HOMEPAGE);
    console.error('Error processing like/dislike', error);
    return res.status(500).json({ message: 'Error processing like/dislike' });
  }
});

module.exports = router;
