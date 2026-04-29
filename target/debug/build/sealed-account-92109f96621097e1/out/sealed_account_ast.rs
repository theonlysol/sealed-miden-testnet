pub const MASM_CODE: &str = r###"use.miden::account

#! Issues a credential into the user's private Merkle tree.
#!
#! Advice provider inputs (in order popped):
#!   [credential_leaf_word (4 felts)]  – RPO hash of the credential data
#!   [leaf_index (1 felt)]             – position in the Merkle tree
#!   [tree_depth (1 felt)]             – depth of the Merkle tree (required by mtree_set)
#!
#! Stack at entry:  [...]
#! Stack at exit:   [...] (net-zero: reads root, mutates it, writes back)
export.issue_credential
    debug.stack  # AUDIT: log stack on entry (should be empty / caller frame only)

    # --- Read new credential leaf from advice provider ---
    # padw allocates 4 stack slots; adv.readw fills them with the leaf hash word.
    padw adv.readw
    # stack: [leaf_w3, leaf_w2, leaf_w1, leaf_w0]

    # --- Load the current Merkle root from account storage slot 0 ---
    push.0 exec.account::get_item
    # stack: [root_w3, root_w2, root_w1, root_w0, leaf_w3, leaf_w2, leaf_w1, leaf_w0]

    # --- Read leaf index and tree depth from advice provider ---
    # mtree_set layout: [V_new(4), index(1), depth(1), R_old(4)]
    # We must push depth THEN index so that after movups the layout is correct.
    adv.read  # leaf index
    adv.read  # tree depth  <-- FIX: was missing; without this mtree_set reads R_old[3] as depth

    # Reorder stack to: [leaf_w3..w0, index, depth, root_w3..w0]
    # Currently:        [depth, index, root_w3..w0, leaf_w3..w0]
    # We need leaf word on top. Move each of the 4 leaf elements up past the
    # two advice reads (depth at 0, index at 1, root at 2-5, leaf at 6-9).
    movup.9 movup.9 movup.9 movup.9
    # stack: [leaf_w3, leaf_w2, leaf_w1, leaf_w0, depth, index, root_w3, root_w2, root_w1, root_w0]
    # swap depth/index so layout matches mtree_set: [V_new(4), index(1), depth(1), R_old(4)]
    movup.5 movup.5 swap
    movdn.5 movdn.5
    # stack: [leaf_w3, leaf_w2, leaf_w1, leaf_w0, index, depth, root_w3, root_w2, root_w1, root_w0]

    # --- Update the Merkle tree ---
    # mtree_set consumes [V_new(4), index(1), depth(1), R_old(4)] = 10 elements
    # and produces        [V_old(4), R_new(4)]                     = 8 elements
    mtree_set

    # Drop the old leaf value (V_old) that mtree_set returns on top
    dropw
    # stack: [root_new_w3, root_new_w2, root_new_w1, root_new_w0]

    # --- Persist the new Merkle root back into account storage slot 0 ---
    push.0 exec.account::set_item
    # set_item consumes [slot(1), value(4)] and returns [old_value(4)]
    # Drop the returned old value
    dropw
    # stack: [] (net-zero)

    debug.stack  # AUDIT: log stack on exit (must be empty)
end

#! Computes a weighted reputation score from credentials provided via the advice provider.
#!
#! Advice provider inputs (popped in order):
#!   current_timestamp (1 felt)
#!   count             (1 felt)  – number of credentials to process
#!   For each credential: score(1), weight(1), timestamp(1)
#!
#! Stack at entry:  [...caller_frame...]
#! Stack at exit:   [total_score, ...caller_frame...]  (pushes exactly 1 element)
export.compute_reputation_score
    debug.stack  # AUDIT: log stack on entry

    push.0    # total_score accumulator
    adv.read  # count
    adv.read  # current_timestamp

    # Reorder to: [count, current_timestamp, total_score, ...caller_frame...]
    # After adv.reads: [current_timestamp, count, total_score, ...]
    swap.1
    # stack: [count, current_timestamp, total_score, ...caller...]

    # Loop condition: continue while count != 0
    dup eq.0 not
    while.true
        # stack at top of loop: [count, current_timestamp, total_score, ...caller...]

        adv.read  # score     → [score, count, curr_ts, total_score, ...]
        adv.read  # weight    → [weight, score, count, curr_ts, total_score, ...]
        adv.read  # timestamp → [cred_ts, weight, score, count, curr_ts, total_score, ...]
        # max stack depth so far: caller_depth + 6 felts (well within 16-element limit)

        # --- 365-day filter: diff = current_timestamp - cred_ts ---
        dup.4     # duplicate curr_ts (at position 4)
        # stack: [curr_ts, cred_ts, weight, score, count, curr_ts, total_score, ...]
        sub
        # stack: [diff, weight, score, count, curr_ts, total_score, ...]

        # is_valid = (31536000 >= diff)  i.e.  diff <= 365 days
        push.31536000
        gte
        # stack: [is_valid, weight, score, count, curr_ts, total_score, ...]

        # weighted_score = score * weight * is_valid
        swap.2    # [score, weight, is_valid, count, curr_ts, total_score, ...]
        swap.1    # [weight, score, is_valid, count, curr_ts, total_score, ...]
        mul       # [score*weight, is_valid, count, curr_ts, total_score, ...]
        mul       # [valid_cs, count, curr_ts, total_score, ...]

        # --- Accumulate into total_score ---
        movup.3   # bring total_score to top
        # stack: [total_score, valid_cs, count, curr_ts, ...]
        add
        # stack: [new_total, count, curr_ts, ...]

        # FIX: was movdn.3 — that placed new_total at position 3, pushing caller
        #      frame elements (e.g. threshold from prove_threshold) into position 2,
        #      corrupting both the score accumulation and subsequent dup.4 indexing.
        #      movdn.2 correctly restores the [count, curr_ts, total_score] layout.
        movdn.2
        # stack: [count, curr_ts, new_total, ...caller...]

        # Decrement count and evaluate loop condition
        sub.1
        dup eq.0 not
    end
    # stack: [0, curr_ts, total_score, ...caller...]  (count reached 0)

    drop drop
    # stack: [total_score, ...caller...]

    debug.stack  # AUDIT: log stack on exit (must be [total_score, ...caller...])
end

#! Proves that the user's aggregated reputation score meets a threshold.
#!
#! Stack at entry: [threshold, ...caller...]
#! Stack at exit:  [...caller...]  (asserts score >= threshold, halts on failure)
export.prove_threshold
    debug.stack  # AUDIT: log stack on entry (must have [threshold] on top)

    # compute_reputation_score pushes total_score on top of the existing stack,
    # so after the call: [total_score, threshold, ...caller...]
    exec.compute_reputation_score

    # gte: pops a=total_score (top) and b=threshold, pushes (a >= b)
    gte

    # assert: halts with FAIL if condition is 0 (score < threshold)
    # The Miden node will surface this as a proof verification failure with
    # error code ERR_ASSERT_FAILED, which the RPC client maps to a clear error message.
    assert

    debug.stack  # AUDIT: log stack on exit (must be empty / back to caller frame)
end
"###;